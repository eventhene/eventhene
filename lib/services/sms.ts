import { db } from "@/lib/db";
import { sendSMS, renderTemplate } from "@/lib/sms/hubtel";
import { normalizeGhPhone } from "@/lib/sms/phone";
import { sanitizeSmsContent } from "@/lib/sms/sanitize";
import { smsSegments } from "@/lib/sms/segments";
import { resolveSenderId } from "@/lib/sms/sender";
import { chargeCredits, refundCredits, InsufficientCreditsError, SmsFrozenError } from "@/lib/sms/credits";
import { formatDate } from "@/lib/utils";

/**
 * An audience can mix any of these sources. Recipients are de-duplicated by
 * phone number, and the first source to claim a number wins, in this order:
 * registered contacts, saved contact lists, typed-in numbers.
 */
export interface AudienceSpec {
  registered?: {
    eventId?: string | null;
    allEvents?: boolean;
    /** ALL | ATTENDED | NOT_ATTENDED | PAID | TICKET_TYPE:<id> | GENDER:<value> */
    filter?: string;
  } | null;
  listIds?: string[];
  phones?: string[];
  /** Event whose title/date/venue fill {event} {date} {venue} for non-registered contacts. */
  contextEventId?: string | null;
}

export interface ResolvedRecipient {
  phone: string; // normalized 233XXXXXXXXX
  name?: string;
  attendeeId?: string;
  ref?: string;
  event?: string;
  date?: string;
  venue?: string;
  source: "registered" | "list" | "manual";
}

export interface ResolvedAudience {
  recipients: ResolvedRecipient[];
  invalid: number;
  duplicates: number;
  breakdown: { registered: number; lists: number; manual: number };
}

const ACTIVE_TICKET_STATUSES = ["TICKET_ISSUED", "PAID", "REGISTERED", "ATTENDED"] as const;

function ticketStatusFilter(filter: string): any {
  if (filter === "ATTENDED") return "ATTENDED";
  if (filter === "NOT_ATTENDED") return { in: ["TICKET_ISSUED", "PAID", "REGISTERED"] };
  if (filter === "PAID") return { in: ["TICKET_ISSUED", "PAID", "ATTENDED"] };
  return { in: [...ACTIVE_TICKET_STATUSES] };
}

export async function resolveAudience(organizerId: string, spec: AudienceSpec): Promise<ResolvedAudience> {
  const recipients: ResolvedRecipient[] = [];
  const seen = new Set<string>();
  let invalid = 0;
  let duplicates = 0;
  const breakdown = { registered: 0, lists: 0, manual: 0 };

  function add(r: Omit<ResolvedRecipient, "phone"> & { phone: string }) {
    const normalized = r.phone ? normalizeGhPhone(r.phone) : null;
    if (!normalized) {
      invalid++;
      return;
    }
    if (seen.has(normalized)) {
      duplicates++;
      return;
    }
    seen.add(normalized);
    recipients.push({ ...r, phone: normalized });
    breakdown[r.source === "registered" ? "registered" : r.source === "list" ? "lists" : "manual"]++;
  }

  const eventInfo = (e: { title: string; startsAt: Date; timezone: string; venue: string }) => ({
    event: e.title,
    date: formatDate(e.startsAt, e.timezone),
    venue: e.venue,
  });

  // Context event for non-registered contacts
  let contextInfo: { event?: string; date?: string; venue?: string } = {};
  if (spec.contextEventId) {
    const ev = await db.event.findFirst({
      where: { id: spec.contextEventId, organizerId },
      select: { title: true, startsAt: true, timezone: true, venue: true },
    });
    if (ev) contextInfo = eventInfo(ev);
  }

  // 1) Registered contacts
  const reg = spec.registered;
  if (reg && (reg.eventId || reg.allEvents)) {
    const events = await db.event.findMany({
      where: reg.allEvents ? { organizerId } : { id: reg.eventId!, organizerId },
      select: { id: true, title: true, startsAt: true, timezone: true, venue: true },
    });
    const filter = reg.filter || "ALL";
    for (const ev of events) {
      const where: any = { eventId: ev.id, status: ticketStatusFilter(filter) };
      if (filter.startsWith("TICKET_TYPE:")) where.ticketTypeId = filter.slice("TICKET_TYPE:".length);
      if (filter.startsWith("GENDER:")) {
        where.attendee = { gender: { equals: filter.slice("GENDER:".length), mode: "insensitive" } };
      }
      const tickets = await db.ticket.findMany({
        where,
        include: { attendee: true },
        orderBy: { createdAt: "asc" },
      });
      for (const t of tickets) {
        if (!t.attendee.phone) continue;
        add({
          phone: t.attendee.phone,
          name: t.attendee.fullName,
          attendeeId: t.attendee.id,
          ref: t.visibleRef,
          ...eventInfo(ev),
          source: "registered",
        });
      }
    }
  }

  // 2) Saved contact lists (must belong to this organizer)
  if (spec.listIds?.length) {
    const contacts = await db.contact.findMany({
      where: { listId: { in: spec.listIds }, list: { organizerId } },
      orderBy: { createdAt: "asc" },
    });
    for (const c of contacts) {
      add({ phone: c.phone, name: c.name ?? undefined, ...contextInfo, source: "list" });
    }
  }

  // 3) Typed-in numbers
  for (const p of spec.phones ?? []) {
    add({ phone: p, ...contextInfo, source: "manual" });
  }

  return { recipients, invalid, duplicates, breakdown };
}

export function renderForRecipient(template: string, r: ResolvedRecipient): string {
  return sanitizeSmsContent(
    renderTemplate(template, {
      name: r.name?.split(" ")[0] ?? "",
      ref: r.ref ?? "",
      event: r.event ?? "",
      date: r.date ?? "",
      venue: r.venue ?? "",
      phone: r.phone,
    })
  );
}

export interface PreparedCampaign {
  safeTemplate: string;
  audience: ResolvedAudience;
  items: Array<{ recipient: ResolvedRecipient; content: string; segments: number }>;
  totalCredits: number;
  skippedEmpty: number;
  templateSegments: ReturnType<typeof smsSegments>;
}

/** Works out exactly who gets what, and what it costs, without writing anything. */
export async function prepareCampaign(opts: {
  organizerId: string;
  message: string;
  spec: AudienceSpec;
}): Promise<PreparedCampaign> {
  const safeTemplate = sanitizeSmsContent(opts.message);
  const audience = await resolveAudience(opts.organizerId, opts.spec);

  const items: PreparedCampaign["items"] = [];
  let skippedEmpty = 0;
  let totalCredits = 0;
  for (const recipient of audience.recipients) {
    const content = renderForRecipient(safeTemplate, recipient);
    if (!content) {
      skippedEmpty++;
      continue;
    }
    const segments = smsSegments(content).segments;
    totalCredits += segments;
    items.push({ recipient, content, segments });
  }
  return {
    safeTemplate,
    audience,
    items,
    totalCredits,
    skippedEmpty,
    templateSegments: smsSegments(safeTemplate),
  };
}

export async function createCampaign(input: {
  organizerId: string;
  createdById: string;
  name: string;
  message: string;
  spec: AudienceSpec;
  eventId?: string | null;
  audienceLabel?: string;
}) {
  const prepared = await prepareCampaign({
    organizerId: input.organizerId,
    message: input.message,
    spec: input.spec,
  });
  if (!prepared.safeTemplate) throw new Error("Message is empty after cleaning.");
  if (prepared.items.length === 0) throw new Error("No valid Ghana phone numbers in that audience.");

  const senderId = await resolveSenderId(input.organizerId);

  // Create the campaign and its recipients first; charge afterwards and roll back on failure.
  const campaign = await db.smsCampaign.create({
    data: {
      organizerId: input.organizerId,
      createdById: input.createdById,
      eventId: input.eventId ?? null,
      name: input.name,
      senderId,
      message: prepared.safeTemplate,
      audience: input.audienceLabel ?? JSON.stringify(input.spec),
      segmentsPer: prepared.templateSegments.segments,
      creditsCharged: prepared.totalCredits,
      totalRecipients: prepared.items.length,
      status: "QUEUED",
    },
  });

  try {
    await db.smsRecipient.createMany({
      data: prepared.items.map((i) => ({
        campaignId: campaign.id,
        phone: i.recipient.phone,
        name: i.recipient.name,
        attendeeId: i.recipient.attendeeId,
        content: i.content,
        segments: i.segments,
      })),
    });
    await chargeCredits({
      organizerId: input.organizerId,
      amount: prepared.totalCredits,
      note: `${input.name} - ${prepared.items.length} recipients`,
      actorId: input.createdById,
      campaignId: campaign.id,
    });
  } catch (e) {
    await db.smsCampaign.delete({ where: { id: campaign.id } }).catch(() => {});
    throw e;
  }

  return { campaign, prepared };
}

export interface ProcessResult {
  campaignId: string;
  status: string;
  total: number;
  sent: number;
  failed: number;
  remaining: number;
  done: boolean;
  busy?: boolean;
}

const CONCURRENCY = 8;

/**
 * Sends the next batch of pending recipients. Safe to call repeatedly (and from
 * two places at once: a lock stops double sending). Finalises the campaign and
 * refunds failed segments once nothing is left to send.
 */
export async function processCampaign(
  campaignId: string,
  opts: { maxRecipients?: number; deadlineMs?: number } = {}
): Promise<ProcessResult> {
  const maxRecipients = opts.maxRecipients ?? 60;
  const deadline = Date.now() + (opts.deadlineMs ?? 40_000);
  const now = new Date();

  const locked = await db.smsCampaign.updateMany({
    where: { id: campaignId, OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }] },
    data: { lockedUntil: new Date(now.getTime() + 90_000) },
  });

  const campaign = await db.smsCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error("campaign_not_found");

  const counts = async () => {
    const grouped = await db.smsRecipient.groupBy({ by: ["status"], where: { campaignId }, _count: true });
    const get = (s: string) => grouped.find((g) => g.status === s)?._count ?? 0;
    return {
      pending: get("PENDING"),
      sent: get("SENT") + get("DELIVERED"),
      failed: get("FAILED"),
    };
  };

  if (locked.count === 0) {
    const c = await counts();
    return {
      campaignId,
      status: campaign.status,
      total: campaign.totalRecipients,
      sent: c.sent,
      failed: c.failed,
      remaining: c.pending,
      done: c.pending === 0,
      busy: true,
    };
  }

  try {
    if (campaign.status === "QUEUED") {
      await db.smsCampaign.update({
        where: { id: campaignId },
        data: { status: "SENDING", startedAt: campaign.startedAt ?? new Date() },
      });
    }

    let budget = maxRecipients;
    while (budget > 0 && Date.now() < deadline) {
      const take = Math.min(CONCURRENCY * 3, budget);
      const batch = await db.smsRecipient.findMany({
        where: { campaignId, status: "PENDING" },
        orderBy: { createdAt: "asc" },
        take,
      });
      if (batch.length === 0) break;

      for (let i = 0; i < batch.length; i += CONCURRENCY) {
        const slice = batch.slice(i, i + CONCURRENCY);
        const results = await Promise.all(
          slice.map((r) => sendSMS(r.phone, r.content ?? campaign.message, campaign.senderId))
        );
        await Promise.all(
          slice.map((r, idx) =>
            db.smsRecipient.update({
              where: { id: r.id },
              data: {
                status: results[idx].ok ? "SENT" : "FAILED",
                providerRef: results[idx].messageId,
                errorText: results[idx].ok ? null : (results[idx].error ?? "send_failed").slice(0, 500),
                sentAt: results[idx].ok ? new Date() : null,
              },
            })
          )
        );
      }
      budget -= batch.length;
    }

    const c = await counts();
    let status = campaign.status === "QUEUED" ? "SENDING" : campaign.status;

    if (c.pending === 0) {
      status = c.failed === 0 ? "SENT" : c.sent === 0 ? "FAILED" : "PARTIAL";

      // Refund failed segments exactly once (compare against refunds already issued).
      const failedSegs = await db.smsRecipient.aggregate({
        where: { campaignId, status: "FAILED" },
        _sum: { segments: true },
      });
      const refunded = await db.smsTransaction.aggregate({
        where: { campaignId, kind: "REFUND" },
        _sum: { amount: true },
      });
      const owed = (failedSegs._sum.segments ?? 0) - (refunded._sum.amount ?? 0);
      if (owed > 0) {
        await refundCredits({
          organizerId: campaign.organizerId,
          amount: owed,
          note: `Refund for ${c.failed} failed message${c.failed === 1 ? "" : "s"} in ${campaign.name}`,
          campaignId,
        }).catch((e) => console.error("[sms] refund failed", e));
      }
    }

    await db.smsCampaign.update({
      where: { id: campaignId },
      data: {
        status: status as any,
        totalSent: c.sent,
        totalFailed: c.failed,
        completedAt: c.pending === 0 ? new Date() : null,
      },
    });

    return {
      campaignId,
      status,
      total: campaign.totalRecipients,
      sent: c.sent,
      failed: c.failed,
      remaining: c.pending,
      done: c.pending === 0,
    };
  } finally {
    await db.smsCampaign.update({ where: { id: campaignId }, data: { lockedUntil: null } }).catch(() => {});
  }
}

/** Per-event composer helper: converts the old audience keys to an AudienceSpec. */
export function specFromEventAudience(eventId: string, audience: string): AudienceSpec {
  if (audience.startsWith("PHONE:")) return { phones: [audience.slice("PHONE:".length)] };
  return { registered: { eventId, filter: audience || "ALL" } };
}

export { InsufficientCreditsError, SmsFrozenError };
