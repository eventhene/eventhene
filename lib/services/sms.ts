import { db } from "@/lib/db";
import { sendSMSBatch, renderTemplate } from "@/lib/sms/hubtel";
import { normalizeGhPhone } from "@/lib/sms/phone";
import { sanitizeSmsContent } from "@/lib/sms/sanitize";
import { smsSegments } from "@/lib/sms/segments";
import { resolveSenderId } from "@/lib/sms/sender";
import { chargeCredits, refundCredits, InsufficientCreditsError, SmsFrozenError } from "@/lib/sms/credits";
import { formatDate } from "@/lib/utils";

/**
 * Audience key format:
 *   ALL
 *   ATTENDED
 *   NOT_ATTENDED
 *   TICKET_TYPE:<id>
 *   GENDER:<string>
 *   PHONE:<+2332447..>     (single arbitrary number)
 */
export type AudienceKey = string;

export interface Recipient {
  phone: string;        // normalized 233XXXXXXXXX
  name?: string;
  ref?: string;
  attendeeId?: string;
}

export async function previewAudience(opts: { eventId?: string; audience: AudienceKey }): Promise<Recipient[]> {
  const audience = opts.audience || "ALL";

  // Single phone number payload
  if (audience.startsWith("PHONE:")) {
    const normalized = normalizeGhPhone(audience.slice("PHONE:".length));
    return normalized ? [{ phone: normalized }] : [];
  }

  if (!opts.eventId) return [];

  const where: any = { eventId: opts.eventId };
  if (audience === "ATTENDED") where.status = "ATTENDED";
  else if (audience === "NOT_ATTENDED") where.status = { in: ["TICKET_ISSUED", "PAID", "REGISTERED"] };
  else if (audience.startsWith("TICKET_TYPE:")) where.ticketTypeId = audience.slice("TICKET_TYPE:".length);
  else if (audience.startsWith("GENDER:")) {
    where.attendee = { gender: { equals: audience.slice("GENDER:".length), mode: "insensitive" } };
  }

  const tickets = await db.ticket.findMany({
    where,
    include: { attendee: true },
  });

  const recipients: Recipient[] = [];
  const seen = new Set<string>();
  for (const t of tickets) {
    const normalized = t.attendee.phone ? normalizeGhPhone(t.attendee.phone) : null;
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    recipients.push({
      phone: normalized,
      name: t.attendee.fullName,
      ref: t.visibleRef,
      attendeeId: t.attendee.id,
    });
  }
  return recipients;
}

export async function createCampaign(input: {
  organizerId: string;
  createdById: string;
  eventId?: string;
  name: string;
  message: string;
  audience: AudienceKey;
}) {
  const safeMessage = sanitizeSmsContent(input.message);
  if (!safeMessage) throw new Error("Message is empty after sanitizing.");

  const recipients = await previewAudience({ eventId: input.eventId, audience: input.audience });
  if (recipients.length === 0) throw new Error("No valid phone numbers in that audience.");

  const seg = smsSegments(safeMessage);
  const senderIdUsed = await resolveSenderId(input.organizerId);
  const creditsNeeded = seg.segments * recipients.length;

  // Reserve credits BEFORE sending. Throws if insufficient / frozen.
  await chargeCredits({
    organizerId: input.organizerId,
    amount: creditsNeeded,
    note: `Campaign ${input.name} - ${recipients.length} recipients x ${seg.segments} segments`,
    actorId: input.createdById,
  });

  const campaign = await db.smsCampaign.create({
    data: {
      organizerId: input.organizerId,
      createdById: input.createdById,
      eventId: input.eventId,
      name: input.name,
      senderId: senderIdUsed,
      message: safeMessage,
      audience: input.audience,
      segmentsPer: seg.segments,
      creditsCharged: creditsNeeded,
      totalRecipients: recipients.length,
      status: "QUEUED",
      recipients: {
        create: recipients.map((r) => ({
          phone: r.phone,
          name: r.name,
          attendeeId: r.attendeeId,
        })),
      },
    },
  });

  // Backfill the campaignId on the DEDUCT txn so it links in the audit log
  await db.smsTransaction.updateMany({
    where: {
      organizerId: input.organizerId,
      campaignId: null,
      kind: "DEDUCT",
      amount: -creditsNeeded,
    },
    data: { campaignId: campaign.id },
  });

  return campaign;
}

export async function runCampaign(campaignId: string) {
  const campaign = await db.smsCampaign.findUnique({
    where: { id: campaignId },
    include: { event: true, recipients: true, organizer: true },
  });
  if (!campaign) throw new Error("campaign_not_found");
  if (campaign.status === "SENT") return campaign;

  await db.smsCampaign.update({
    where: { id: campaign.id },
    data: { status: "SENDING", startedAt: new Date() },
  });

  const pending = campaign.recipients.filter((r) => r.status === "PENDING");

  // Precompute personalized content per recipient (support {ref} via ticket lookup)
  const refByAttendee = new Map<string, string>();
  if (/\{ref\}/i.test(campaign.message) && campaign.eventId) {
    const refs = await db.ticket.findMany({
      where: {
        eventId: campaign.eventId,
        attendeeId: { in: pending.map((p) => p.attendeeId!).filter(Boolean) as string[] },
      },
      select: { attendeeId: true, visibleRef: true },
    });
    for (const r of refs) refByAttendee.set(r.attendeeId, r.visibleRef);
  }

  const items = pending.map((p) => ({
    to: p.phone,
    content: renderTemplate(campaign.message, {
      name: p.name?.split(" ")[0] ?? "",
      ref: refByAttendee.get(p.attendeeId ?? "") ?? "",
      event: campaign.event?.title ?? "",
      date: campaign.event ? formatDate(campaign.event.startsAt, campaign.event.timezone) : "",
      venue: campaign.event?.venue ?? "",
      phone: p.phone,
    }),
  }));

  const results = await sendSMSBatch(items, campaign.senderId);

  let sent = 0;
  let failed = 0;
  for (let i = 0; i < pending.length; i++) {
    const r = results[i];
    if (r.ok) sent++; else failed++;
    await db.smsRecipient.update({
      where: { id: pending[i].id },
      data: {
        status: r.ok ? "SENT" : "FAILED",
        providerRef: r.messageId,
        errorText: r.ok ? null : r.error?.slice(0, 500),
        sentAt: r.ok ? new Date() : null,
      },
    });
  }

  // Refund credits for failed sends
  if (failed > 0) {
    const refund = failed * campaign.segmentsPer;
    await refundCredits({
      organizerId: campaign.organizerId,
      amount: refund,
      note: `Refund for ${failed} failed sends in ${campaign.name}`,
      campaignId: campaign.id,
    }).catch(() => {});
  }

  const final = await db.smsCampaign.update({
    where: { id: campaign.id },
    data: {
      status: failed === 0 ? "SENT" : sent === 0 ? "FAILED" : "PARTIAL",
      totalSent: campaign.totalSent + sent,
      totalFailed: campaign.totalFailed + failed,
      completedAt: new Date(),
    },
  });
  return final;
}

export { InsufficientCreditsError, SmsFrozenError };
