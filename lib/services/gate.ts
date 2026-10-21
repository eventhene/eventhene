import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { createOrder } from "@/lib/services/orders";
import { issueTicketsForOrder } from "@/lib/services/tickets";
import { sendTicketEmails } from "@/lib/services/notify";
import { placeholderEmail } from "@/lib/guest-email";
import { normalizeGhPhone } from "@/lib/sms/phone";
import { sendSMS } from "@/lib/sms/hubtel";
import { smsSegments } from "@/lib/sms/segments";
import { chargeCredits, refundCredits } from "@/lib/sms/credits";

/**
 * Registering at the gate.
 *
 * Someone standing at the door is, by definition, attending. So this path creates
 * the registration and checks them in as one act, and sends a single text that
 * both confirms the registration and welcomes them, instead of the two separate
 * messages the online flow sends.
 */

/** How long either side of the event we still treat an arrival as "at the gate". */
const EARLY_MS = 12 * 60 * 60 * 1000;
const LATE_MS = 6 * 60 * 60 * 1000;

export interface GateAttendeeInput {
  fullName: string;
  email?: string;
  phone?: string;
  gender?: string;
  city?: string;
  address?: string;
  organization?: string;
  ageRange?: string;
  emergencyContact?: string;
  customAnswers?: Record<string, unknown>;
}

export class GateError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = "GateError";
  }
}

export function makeGateToken(): string {
  return nanoid(12);
}

/** Creates the token on first use so existing events pick one up without a backfill. */
export async function ensureGateToken(eventId: string): Promise<string> {
  const ev = await db.event.findUnique({ where: { id: eventId }, select: { gateToken: true } });
  if (!ev) throw new GateError("Event not found.", 404);
  if (ev.gateToken) return ev.gateToken;
  const token = makeGateToken();
  await db.event.update({ where: { id: eventId }, data: { gateToken: token } });
  return token;
}

/** True when the event is close enough in time that walking in makes sense. */
export function isGateWindowOpen(startsAt: Date, endsAt: Date, now = new Date()): boolean {
  return now.getTime() >= startsAt.getTime() - EARLY_MS && now.getTime() <= endsAt.getTime() + LATE_MS;
}

/** One text that confirms the registration and welcomes them in, trimmed to a single segment. */
export function gateSms(opts: { title: string; firstName: string; ref: string }): string {
  const name = opts.firstName ? ` ${opts.firstName}` : "";
  let t = opts.title;
  for (;;) {
    const msg = `Welcome${name}! You are registered and checked in at ${t}. Ref: ${opts.ref}. Enjoy the event! - EventHene`;
    if (smsSegments(msg).segments <= 1 || t.length <= 8) return msg;
    t = t.slice(0, Math.max(8, t.length - 4)).trimEnd();
  }
}

async function sendGateSms(ticketId: string): Promise<void> {
  try {
    const ticket = await db.ticket.findUnique({
      where: { id: ticketId },
      include: { attendee: true, event: true, order: { select: { buyerPhone: true } } },
    });
    if (!ticket || ticket.welcomedAt) return;
    const phone = ticket.attendee.phone || ticket.order?.buyerPhone;
    if (!phone) return;

    const msg = gateSms({
      title: ticket.event.title,
      firstName: ticket.attendee.fullName.split(" ")[0] || "",
      ref: ticket.visibleRef,
    });
    const credits = smsSegments(msg).segments;
    // Same cost rule as everywhere else: free events spend the organizer's credits,
    // paid events are covered by the platform fee.
    const organizerPays = ticket.event.type === "FREE";

    if (organizerPays) {
      try {
        await chargeCredits({
          organizerId: ticket.event.organizerId,
          amount: credits,
          note: `Gate registration SMS - ${ticket.event.title}`,
        });
      } catch (e: any) {
        console.warn("[gate] SMS skipped, organizer credits unavailable:", e?.message);
        return;
      }
    }

    const sms = await sendSMS(phone, msg);
    if (sms.ok) {
      await db.ticket.update({ where: { id: ticketId }, data: { welcomedAt: new Date() } }).catch(() => {});
    } else {
      console.error("[gate] SMS failed", sms.error);
      if (organizerPays) {
        await refundCredits({
          organizerId: ticket.event.organizerId,
          amount: credits,
          note: "Refund for gate SMS that could not be delivered",
        }).catch(() => {});
      }
    }
  } catch (e) {
    console.error("[gate] SMS error", e);
  }
}

/** Runs side work without letting it hold the response open. The registration is
 *  already committed by this point, so a slow network must never cost us the row. */
async function capped(work: Promise<unknown>, ms: number, label: string): Promise<void> {
  await Promise.race([
    work.catch((e) => console.error(`[gate] ${label} failed`, e)),
    new Promise<void>((r) => setTimeout(r, ms)),
  ]);
}

export interface GateResult {
  ticketId: string;
  visibleRef: string;
  attendeeName: string;
  ticketType: string;
  checkedIn: boolean;
  /** Set when we registered them but did not check them in. */
  note?: string;
}

/**
 * Registers a walk-in and, when the event is actually on, checks them in too.
 *
 * `checkIn` lets an admin register someone ahead of time without admitting them;
 * the public gate form always asks to check in, because scanning the poster means
 * the person is standing there.
 */
export async function registerAtGate(opts: {
  eventId: string;
  attendee: GateAttendeeInput;
  ticketTypeId?: string;
  checkIn?: boolean;
  scannedById?: string | null;
  via: "public" | "admin";
}): Promise<GateResult> {
  const event = await db.event.findUnique({
    where: { id: opts.eventId },
    include: { ticketTypes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!event) throw new GateError("Event not found.", 404);
  if (event.status !== "PUBLISHED") throw new GateError("This event is not open for registration.", 409);
  if (event.type !== "FREE") {
    throw new GateError("Gate registration is only available for free events right now.", 409);
  }
  if (!opts.attendee.fullName?.trim()) throw new GateError("Please enter a name.");
  if (opts.attendee.phone && !normalizeGhPhone(opts.attendee.phone)) {
    throw new GateError("That phone number does not look right.");
  }

  const ticketType = opts.ticketTypeId
    ? event.ticketTypes.find((t) => t.id === opts.ticketTypeId)
    : event.ticketTypes[0];
  if (!ticketType) throw new GateError("This event has no ticket type to register against.", 409);

  const phone = opts.attendee.phone?.trim() || "";
  const email = opts.attendee.email?.trim() || "";

  const order = await createOrder({
    eventId: event.id,
    buyerName: opts.attendee.fullName.trim(),
    buyerEmail: email || placeholderEmail(phone || event.id),
    buyerPhone: phone || undefined,
    items: [
      {
        ticketTypeId: ticketType.id,
        quantity: 1,
        attendees: [{ ...opts.attendee, email: email || undefined, phone: phone || undefined }],
      },
    ],
  });

  const issued = await issueTicketsForOrder(order.orderId);
  const ticket = issued[0];
  if (!ticket) throw new GateError("Could not create that registration.", 500);

  const windowOpen = isGateWindowOpen(event.startsAt, event.endsAt);
  const shouldCheckIn = (opts.checkIn ?? true) && windowOpen;

  if (shouldCheckIn) {
    // Straight to attended: they are standing at the door.
    await db.ticket.updateMany({
      where: { id: ticket.ticketId, status: { in: ["TICKET_ISSUED", "PAID", "REGISTERED"] } },
      data: {
        status: "ATTENDED",
        usedAt: new Date(),
        scannedByUserId: opts.scannedById ?? null,
        source: "GATE",
      },
    });
    // ScanLog needs a real user, so only the admin path writes one. A public
    // walk-in is still traceable: the ticket carries source=GATE and usedAt.
    if (opts.scannedById) {
      await db.scanLog
        .create({
          data: {
            ticketId: ticket.ticketId,
            eventId: event.id,
            scannedById: opts.scannedById,
            result: "VALID",
          },
        })
        .catch(() => {});
    }
    // One text, not two. Capped so a slow network never holds up the queue.
    await capped(sendGateSms(ticket.ticketId), 2500, "gate SMS");
  } else {
    await db.ticket.update({ where: { id: ticket.ticketId }, data: { source: "GATE" } }).catch(() => {});
    // Registered but not admitted, so they get the ordinary confirmation with a
    // link to their QR ticket. Without this the gate form sent nothing at all
    // outside the event window and the person left with no record.
    //
    // sendTicketEmails directly rather than fulfilOrder: fulfilOrder renders the
    // ticket PDFs first, which is slow enough to blow a serverless time limit and
    // leave the order stranded without its tickets. This sends the SMS first and
    // lets the email follow; the PDF is reachable from the ticket link either way.
    await capped(sendTicketEmails(order.orderId), 8000, "confirmation");
  }

  return {
    ticketId: ticket.ticketId,
    visibleRef: ticket.visibleRef,
    attendeeName: ticket.attendeeName ?? opts.attendee.fullName.trim(),
    ticketType: ticketType.name,
    checkedIn: shouldCheckIn,
    note: shouldCheckIn
      ? undefined
      : windowOpen
        ? "Registered. Not checked in. Their ticket has been sent."
        : "Registered for the event. Check-in happens on the day; their QR ticket has been sent.",
  };
}
