import { db } from "@/lib/db";
import { sendHubtelBatch, normalizeGhPhone, renderTemplate } from "@/lib/sms/hubtel";
import { formatDate } from "@/lib/utils";

export type AudienceKey = "ALL" | "ATTENDED" | "NOT_ATTENDED" | string; // or "TICKET_TYPE:<id>"

export async function previewAudience(eventId: string, audience: AudienceKey) {
  const where: any = { eventId };
  if (audience === "ATTENDED") where.status = "ATTENDED";
  else if (audience === "NOT_ATTENDED") where.status = { in: ["TICKET_ISSUED", "PAID", "REGISTERED"] };
  else if (audience.startsWith("TICKET_TYPE:")) where.ticketTypeId = audience.split(":")[1];

  const tickets = await db.ticket.findMany({
    where,
    include: { attendee: true },
  });
  const recipients = tickets
    .map((t) => ({
      phone: t.attendee.phone ? normalizeGhPhone(t.attendee.phone) : null,
      name: t.attendee.fullName,
      ref: t.visibleRef,
      attendeeId: t.attendeeId,
    }))
    .filter((r) => r.phone && r.phone.startsWith("+") && r.phone.length >= 10) as {
      phone: string; name: string; ref: string; attendeeId: string;
    }[];

  // dedupe by phone
  const seen = new Set<string>();
  return recipients.filter((r) => (seen.has(r.phone) ? false : (seen.add(r.phone), true)));
}

export async function createCampaign(input: {
  organizerId: string;
  createdById: string;
  eventId?: string;
  name: string;
  senderId: string;
  message: string;
  audience: AudienceKey;
}) {
  if (!input.eventId && input.audience !== "ALL") {
    throw new Error("Event is required for this audience.");
  }
  let recipients: { phone: string; name: string; ref: string; attendeeId: string }[] = [];
  if (input.eventId) {
    recipients = await previewAudience(input.eventId, input.audience);
  }

  if (recipients.length === 0) throw new Error("No valid phone numbers in that audience.");

  const campaign = await db.smsCampaign.create({
    data: {
      organizerId: input.organizerId,
      createdById: input.createdById,
      eventId: input.eventId,
      name: input.name,
      senderId: input.senderId.slice(0, 11), // Hubtel SenderID max 11 chars
      message: input.message,
      audience: input.audience,
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
  return campaign;
}

export async function runCampaign(campaignId: string) {
  const campaign = await db.smsCampaign.findUnique({
    where: { id: campaignId },
    include: { event: true, recipients: true },
  });
  if (!campaign) throw new Error("campaign_not_found");
  if (campaign.status === "SENT") return campaign;

  await db.smsCampaign.update({
    where: { id: campaign.id },
    data: { status: "SENDING", startedAt: new Date() },
  });

  const pending = campaign.recipients.filter((r) => r.status === "PENDING");
  const inputs = pending.map((r) => {
    // Try to pull ref via attendee for personalization
    const content = renderTemplate(campaign.message, {
      name: r.name?.split(" ")[0] ?? "",
      ref: "", // filled below after lookup if {ref} is used
      event: campaign.event?.title ?? "",
      date: campaign.event ? formatDate(campaign.event.startsAt, campaign.event.timezone) : "",
      venue: campaign.event?.venue ?? "",
    });
    return { to: r.phone, from: campaign.senderId, content };
  });

  // If template references {ref} we need the ticket ref per attendee
  if (/\{ref\}/i.test(campaign.message) && campaign.eventId) {
    const refs = await db.ticket.findMany({
      where: { eventId: campaign.eventId, attendeeId: { in: pending.map((p) => p.attendeeId!).filter(Boolean) } },
      select: { attendeeId: true, visibleRef: true },
    });
    const map = new Map(refs.map((r) => [r.attendeeId, r.visibleRef]));
    pending.forEach((p, i) => {
      inputs[i].content = renderTemplate(campaign.message, {
        name: p.name?.split(" ")[0] ?? "",
        ref: map.get(p.attendeeId ?? "") ?? "",
        event: campaign.event?.title ?? "",
        date: campaign.event ? formatDate(campaign.event.startsAt, campaign.event.timezone) : "",
        venue: campaign.event?.venue ?? "",
      });
    });
  }

  const results = await sendHubtelBatch(inputs, { concurrency: 4, delayMs: 80 });

  let sent = 0;
  let failed = 0;
  for (let i = 0; i < pending.length; i++) {
    const r = results[i];
    if (r.ok) sent++;
    else failed++;
    await db.smsRecipient.update({
      where: { id: pending[i].id },
      data: {
        status: r.ok ? "SENT" : "FAILED",
        providerRef: r.messageId,
        errorText: r.ok ? null : r.errorText,
        sentAt: r.ok ? new Date() : null,
      },
    });
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
