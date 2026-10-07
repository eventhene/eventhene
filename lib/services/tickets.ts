import { db } from "@/lib/db";
import { buildVisibleRef } from "@/lib/refs";
import { generateTicketToken, verifyQrPayload, hashToken } from "@/lib/qr";
import type { Prisma } from "@prisma/client";
import { sendWelcomeSms } from "@/lib/services/notify";

/** Send the welcome text, but never let a slow SMS hold up the gate: give it 2.5s at most. */
async function welcomeWithoutBlocking(ticketId: string): Promise<void> {
  await Promise.race([sendWelcomeSms(ticketId), new Promise<void>((r) => setTimeout(r, 2500))]);
}

export interface IssuedTicket {
  ticketId: string;
  qrToken: string;
  visibleRef: string;
  attendeeName: string;
  attendeeEmail: string | null;
}

/**
 * After an order is paid (or for a free event), create attendees + tickets
 * from the draft payload that was stored on the order.
 * Idempotent and race-safe: the order row is locked so the webhook and the
 * client poller can never issue (or count) the same order twice.
 * Paid tickets only count towards `sold` here, once payment has succeeded.
 */
export async function issueTicketsForOrder(orderId: string): Promise<IssuedTicket[]> {
  return db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${orderId} FOR UPDATE`;

      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { event: true, tickets: { include: { attendee: true } } }
      });
      if (!order) throw new Error("order_not_found");

      if (order.tickets.length > 0) {
        return order.tickets.map((t) => ({
          ticketId: t.id,
          qrToken: t.qrToken,
          visibleRef: t.visibleRef,
          attendeeName: t.attendee.fullName,
          attendeeEmail: t.attendee.email
        }));
      }

      const draft = order.draftPayload as any;
      if (!draft?.items) throw new Error("order_missing_draft");

      const issued: IssuedTicket[] = [];

      for (const item of draft.items as any[]) {
        for (const a of item.attendees as any[]) {
          const attendee = await tx.attendee.create({
            data: {
              eventId: order.eventId,
              orderId: order.id,
              fullName: a.fullName,
              email: a.email ?? order.buyerEmail,
              phone: a.phone ?? order.buyerPhone,
              gender: a.gender,
              city: a.city,
              address: a.address,
              organization: a.organization,
              ageRange: a.ageRange,
              emergencyContact: a.emergencyContact,
              customAnswers: (a.customAnswers ?? {}) as Prisma.InputJsonValue
            }
          });
          const { token, tokenHash } = generateTicketToken();
          const visibleRef = buildVisibleRef(a.fullName.split(" ")[0] || "GST", order.event.shortCode);
          const ticket = await tx.ticket.create({
            data: {
              eventId: order.eventId,
              ticketTypeId: item.ticketTypeId,
              attendeeId: attendee.id,
              orderId: order.id,
              visibleRef,
              qrToken: token,
              qrTokenHash: tokenHash,
              status: order.event.type === "FREE" ? "REGISTERED" : "TICKET_ISSUED",
              issuedAt: new Date()
            }
          });
          issued.push({
            ticketId: ticket.id,
            qrToken: token,
            visibleRef,
            attendeeName: attendee.fullName,
            attendeeEmail: attendee.email
          });
        }

        if (order.event.type === "PAID") {
          await tx.ticketType.update({
            where: { id: item.ticketTypeId },
            data: { sold: { increment: (item.attendees as any[]).length } }
          });
        }
      }
      return issued;
    },
    { timeout: 30000, maxWait: 10000 }
  );
}

export type ScanResultCode =
  | "VALID"
  | "ALREADY_USED"
  | "INVALID"
  | "INVALID_SIGNATURE"
  | "WRONG_EVENT"
  | "NOT_PAID"
  | "REFUNDED"
  | "CANCELLED"
  | "EVENT_NOT_ACTIVE"
  | "EXPIRED"
  | "MALFORMED"
  | "BAD_VERSION"
  | "BAD_PAYLOAD";

export interface ScanResult {
  result: ScanResultCode;
  attendeeName?: string;
  ticketType?: string;
  eventTitle?: string;
  visibleRef?: string;
  previouslyScannedAt?: Date | null;
}

export async function validateScan(opts: {
  qr: string;
  eventId: string;
  scannedById: string;
  ip?: string;
  userAgent?: string;
}): Promise<ScanResult> {
  const verified = verifyQrPayload(opts.qr);
  if (!verified.ok) {
    await db.scanLog
      .create({
        data: {
          eventId: opts.eventId,
          scannedById: opts.scannedById,
          result: verified.reason,
          ip: opts.ip,
          userAgent: opts.userAgent
        }
      })
      .catch(() => {});
    return { result: verified.reason as ScanResultCode };
  }

  if (verified.eid !== opts.eventId) {
    await db.scanLog.create({
      data: {
        eventId: opts.eventId,
        scannedById: opts.scannedById,
        result: "WRONG_EVENT",
        ip: opts.ip,
        userAgent: opts.userAgent
      }
    });
    return { result: "WRONG_EVENT" };
  }

  const tokenHash = hashToken(verified.tid);
  const ticket = await db.ticket.findUnique({
    where: { qrTokenHash: tokenHash },
    include: { attendee: true, ticketType: true, event: true }
  });

  if (!ticket) {
    await db.scanLog.create({
      data: {
        eventId: opts.eventId,
        scannedById: opts.scannedById,
        result: "INVALID",
        ip: opts.ip,
        userAgent: opts.userAgent
      }
    });
    return { result: "INVALID" };
  }
  if (ticket.eventId !== opts.eventId) {
    return { result: "WRONG_EVENT" };
  }

  // Status checks
  if (ticket.status === "ATTENDED") {
    await db.scanLog.create({
      data: {
        ticketId: ticket.id,
        eventId: opts.eventId,
        scannedById: opts.scannedById,
        result: "ALREADY_USED",
        ip: opts.ip,
        userAgent: opts.userAgent
      }
    });
    return {
      result: "ALREADY_USED",
      attendeeName: ticket.attendee.fullName,
      ticketType: ticket.ticketType.name,
      eventTitle: ticket.event.title,
      visibleRef: ticket.visibleRef,
      previouslyScannedAt: ticket.usedAt
    };
  }
  if (ticket.status === "REFUNDED") return { result: "REFUNDED", visibleRef: ticket.visibleRef };
  if (ticket.status === "CANCELLED") return { result: "CANCELLED", visibleRef: ticket.visibleRef };
  if (ticket.status === "PENDING_PAYMENT") return { result: "NOT_PAID", visibleRef: ticket.visibleRef };

  // Atomic flip — guards against concurrent scans
  const updated = await db.ticket.updateMany({
    where: {
      id: ticket.id,
      status: { in: ["TICKET_ISSUED", "PAID", "REGISTERED"] }
    },
    data: {
      status: "ATTENDED",
      usedAt: new Date(),
      scannedByUserId: opts.scannedById
    }
  });

  if (updated.count === 0) {
    return {
      result: "ALREADY_USED",
      attendeeName: ticket.attendee.fullName,
      ticketType: ticket.ticketType.name,
      eventTitle: ticket.event.title,
      visibleRef: ticket.visibleRef
    };
  }

  await db.scanLog.create({
    data: {
      ticketId: ticket.id,
      eventId: opts.eventId,
      scannedById: opts.scannedById,
      result: "VALID",
      ip: opts.ip,
      userAgent: opts.userAgent
    }
  });

  await welcomeWithoutBlocking(ticket.id);

  return {
    result: "VALID",
    attendeeName: ticket.attendee.fullName,
    ticketType: ticket.ticketType.name,
    eventTitle: ticket.event.title,
    visibleRef: ticket.visibleRef
  };
}

export async function manualCheckIn(opts: { ticketId: string; scannedById: string }): Promise<ScanResult> {
  const ticket = await db.ticket.findUnique({
    where: { id: opts.ticketId },
    include: { attendee: true, ticketType: true, event: true }
  });
  if (!ticket) return { result: "INVALID" };
  if (ticket.status === "ATTENDED") {
    return {
      result: "ALREADY_USED",
      attendeeName: ticket.attendee.fullName,
      visibleRef: ticket.visibleRef,
      previouslyScannedAt: ticket.usedAt
    };
  }
  const updated = await db.ticket.updateMany({
    where: { id: ticket.id, status: { in: ["TICKET_ISSUED", "PAID", "REGISTERED"] } },
    data: { status: "ATTENDED", usedAt: new Date(), scannedByUserId: opts.scannedById }
  });
  if (updated.count === 0) {
    return { result: "ALREADY_USED", attendeeName: ticket.attendee.fullName };
  }
  await db.scanLog.create({
    data: {
      ticketId: ticket.id,
      eventId: ticket.eventId,
      scannedById: opts.scannedById,
      result: "VALID_MANUAL"
    }
  });
  await welcomeWithoutBlocking(ticket.id);
  return {
    result: "VALID",
    attendeeName: ticket.attendee.fullName,
    ticketType: ticket.ticketType.name,
    eventTitle: ticket.event.title,
    visibleRef: ticket.visibleRef
  };
}
