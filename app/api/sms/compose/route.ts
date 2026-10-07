import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOrganizer } from "@/lib/auth";
import { normalizeGhPhone } from "@/lib/sms/phone";
import { sanitizeSmsContent } from "@/lib/sms/sanitize";
import { smsSegments } from "@/lib/sms/segments";
import { resolveSenderId } from "@/lib/sms/sender";
import { chargeCredits, refundCredits, InsufficientCreditsError, SmsFrozenError } from "@/lib/sms/credits";
import { sendSMSBatch, renderTemplate } from "@/lib/sms/hubtel";

interface Recipient {
  phone: string;
  name?: string;
  ref?: string;
  attendeeId?: string;
  event?: string;
  date?: string;
  venue?: string;
}

async function resolveAudience(organizerId: string, audience: any): Promise<Recipient[]> {
  const recipients: Recipient[] = [];
  const seen = new Set<string>();

  function addRecipient(r: Recipient) {
    if (!r.phone) return;
    const normalized = normalizeGhPhone(r.phone);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    recipients.push({ ...r, phone: normalized });
  }

  // Manual contacts
  if (audience.contacts?.length) {
    for (const c of audience.contacts) {
      addRecipient({ phone: c.phone, name: c.name });
    }
  }

  // Single number
  if (audience.singlePhone) {
    addRecipient({ phone: audience.singlePhone });
  }

  // Event-based audiences
  if (audience.eventId) {
    const event = await db.event.findUnique({
      where: { id: audience.eventId },
      include: { organizer: true },
    });
    if (!event || event.organizer.id !== organizerId) return recipients;

    const where: any = { eventId: event.id };
    const filter = audience.eventFilter || "ALL";
    if (filter === "ATTENDED") where.status = "ATTENDED";
    else if (filter === "NOT_ATTENDED") where.status = { in: ["TICKET_ISSUED", "PAID", "REGISTERED"] };
    else if (filter === "PAID") where.status = { in: ["PAID", "TICKET_ISSUED", "ATTENDED", "NOT_ATTENDED"] };
    else if (filter.startsWith("TICKET_TYPE:")) where.ticketTypeId = filter.slice("TICKET_TYPE:".length);

    const tickets = await db.ticket.findMany({
      where,
      include: { attendee: true },
    });
    for (const t of tickets) {
      if (!t.attendee.phone) continue;
      addRecipient({
        phone: t.attendee.phone,
        name: t.attendee.fullName,
        ref: t.visibleRef,
        attendeeId: t.attendee.id,
        event: event.title,
        date: event.startsAt.toLocaleDateString("en-GH", { weekday: "short", month: "short", day: "numeric" }),
        venue: event.venue,
      });
    }
  }

  // All events for this organizer
  if (audience.allEvents) {
    const events = await db.event.findMany({
      where: { organizerId },
      select: { id: true, title: true, venue: true, startsAt: true },
    });
    for (const event of events) {
      const tickets = await db.ticket.findMany({
        where: { eventId: event.id },
        include: { attendee: true },
      });
      for (const t of tickets) {
        if (!t.attendee.phone) continue;
        addRecipient({
          phone: t.attendee.phone,
          name: t.attendee.fullName,
          ref: t.visibleRef,
          attendeeId: t.attendee.id,
          event: event.title,
          venue: event.venue,
        });
      }
    }
  }

  return recipients;
}

const PreviewBody = z.object({
  audience: z.any(),
  message: z.string().optional(),
});

const SendBody = z.object({
  name: z.string().min(1),
  message: z.string().min(1),
  audience: z.any(),
});

export async function POST(req: NextRequest) {
  try {
    const { user, organizer } = await requireOrganizer(req);
    const body = await req.json();

    // Preview mode
    if (body.preview) {
      const { audience, message } = PreviewBody.parse(body);
      const recipients = await resolveAudience(organizer.id, audience);
      const safeMsg = sanitizeSmsContent(message || "test");
      const seg = smsSegments(safeMsg);
      const senderId = await resolveSenderId(organizer.id);
      return NextResponse.json({
        count: recipients.length,
        segments: seg,
        estimatedCredits: seg.segments * recipients.length,
        balance: organizer.smsBalance,
        senderId,
        sanitized: sanitizeSmsContent(message || ""),
        sample: recipients.slice(0, 5).map((r) => ({ phone: r.phone, name: r.name })),
      });
    }

    // Send mode
    const { name, message, audience } = SendBody.parse(body);
    const safeMessage = sanitizeSmsContent(message);
    if (!safeMessage) return NextResponse.json({ error: "Message is empty after sanitizing." }, { status: 400 });

    const recipients = await resolveAudience(organizer.id, audience);
    if (recipients.length === 0) return NextResponse.json({ error: "No valid phone numbers found." }, { status: 400 });

    const seg = smsSegments(safeMessage);
    const senderIdUsed = await resolveSenderId(organizer.id);
    const creditsNeeded = seg.segments * recipients.length;

    await chargeCredits({
      organizerId: organizer.id,
      amount: creditsNeeded,
      note: `${name} - ${recipients.length} recipients x ${seg.segments} segments`,
      actorId: user.id,
    });

    const campaign = await db.smsCampaign.create({
      data: {
        organizerId: organizer.id,
        createdById: user.id,
        name,
        senderId: senderIdUsed,
        message: safeMessage,
        audience: JSON.stringify(audience),
        segmentsPer: seg.segments,
        creditsCharged: creditsNeeded,
        totalRecipients: recipients.length,
        status: "SENDING",
        startedAt: new Date(),
        recipients: {
          create: recipients.map((r) => ({
            phone: r.phone,
            name: r.name,
            attendeeId: r.attendeeId,
          })),
        },
      },
    });

    // Send messages
    const items = recipients.map((r) => ({
      to: r.phone,
      content: renderTemplate(safeMessage, {
        name: r.name?.split(" ")[0] ?? "",
        ref: r.ref ?? "",
        event: r.event ?? "",
        date: r.date ?? "",
        venue: r.venue ?? "",
        phone: r.phone,
      }),
    }));

    const results = await sendSMSBatch(items, senderIdUsed);

    let sent = 0;
    let failed = 0;
    for (let i = 0; i < recipients.length; i++) {
      const r = results[i];
      if (r.ok) sent++; else failed++;
      await db.smsRecipient.update({
        where: { id: (await db.smsRecipient.findFirst({ where: { campaignId: campaign.id, phone: recipients[i].phone } }))!.id },
        data: {
          status: r.ok ? "SENT" : "FAILED",
          providerRef: r.messageId,
          errorText: r.ok ? null : r.error?.slice(0, 500),
          sentAt: r.ok ? new Date() : null,
        },
      });
    }

    if (failed > 0) {
      const refund = failed * seg.segments;
      await refundCredits({
        organizerId: organizer.id,
        amount: refund,
        note: `Refund for ${failed} failed in ${name}`,
        campaignId: campaign.id,
      }).catch(() => {});
    }

    await db.smsCampaign.update({
      where: { id: campaign.id },
      data: {
        status: failed === 0 ? "SENT" : sent === 0 ? "FAILED" : "PARTIAL",
        totalSent: sent,
        totalFailed: failed,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, totalSent: sent, totalFailed: failed });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (e instanceof InsufficientCreditsError) return NextResponse.json({ error: e.message }, { status: 402 });
    if (e instanceof SmsFrozenError) return NextResponse.json({ error: e.message }, { status: 403 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    console.error("[sms/compose]", e);
    return NextResponse.json({ error: e.message || "internal_error" }, { status: 500 });
  }
}
