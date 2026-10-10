import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createOrder } from "@/lib/services/orders";
import { fulfilOrder } from "@/lib/services/fulfil";
import { rateLimit } from "@/lib/ratelimit";
import { db } from "@/lib/db";
import { placeholderEmail } from "@/lib/guest-email";
import { normalizeGhPhone } from "@/lib/sms/phone";

export const maxDuration = 60;

const AttendeeSchema = z.object({
  fullName: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  gender: z.string().max(40).optional(),
  city: z.string().max(80).optional(),
  address: z.string().max(200).optional(),
  organization: z.string().max(120).optional(),
  ageRange: z.string().max(40).optional(),
  emergencyContact: z.string().max(120).optional(),
  customAnswers: z.record(z.any()).optional()
});

const Body = z.object({
  eventId: z.string().min(1),
  buyerName: z.string().max(120).optional().or(z.literal("")),
  buyerEmail: z.string().email().optional().or(z.literal("")),
  buyerPhone: z.string().max(40).optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        ticketTypeId: z.string().min(1),
        quantity: z.number().int().min(1).max(10),
        attendees: z.array(AttendeeSchema).min(1).max(10)
      })
    )
    .min(1)
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "anon";
    const ok = await rateLimit(`order:${ip}`, 20, 60, "orders");
    if (!ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

    const data = Body.parse(await req.json());

    const ev = await db.event.findUnique({ where: { id: data.eventId }, select: { collectBuyerInfo: true } });
    if (!ev) return NextResponse.json({ error: "event_not_found" }, { status: 404 });

    const allAttendees = data.items.flatMap((i) => i.attendees);
    let buyerName = data.buyerName?.trim() || "";
    let buyerEmail = data.buyerEmail?.trim() || "";
    let buyerPhone = data.buyerPhone?.trim() || "";

    if (ev.collectBuyerInfo) {
      // Original flow: the buyer's own name and email are required.
      if (!buyerName) return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
      if (!buyerEmail) return NextResponse.json({ error: "Please enter your email address." }, { status: 400 });
    } else {
      // Contact step is off: every guest must give a phone number or an email (phone is best).
      for (const [i, a] of allAttendees.entries()) {
        const hasPhone = !!a.phone && !!normalizeGhPhone(a.phone);
        const hasEmail = !!a.email;
        if (!a.fullName?.trim()) {
          return NextResponse.json({ error: `Please enter the name for guest ${i + 1}.` }, { status: 400 });
        }
        if (!hasPhone && !hasEmail) {
          return NextResponse.json(
            { error: `Please add a phone number or an email for ${a.fullName || `guest ${i + 1}`}. Phone is best, it is how the ticket reaches them.` },
            { status: 400 }
          );
        }
        if (a.phone && !hasPhone) {
          return NextResponse.json({ error: `The phone number for ${a.fullName} does not look right.` }, { status: 400 });
        }
      }
      const first = allAttendees[0];
      buyerName = buyerName || first.fullName;
      buyerPhone = buyerPhone || first.phone || "";
      buyerEmail = buyerEmail || first.email || placeholderEmail(first.phone || data.eventId);
    }

    const result = await createOrder({
      eventId: data.eventId,
      buyerName,
      buyerEmail,
      buyerPhone: buyerPhone || undefined,
      items: data.items.map((i) => ({
        ticketTypeId: i.ticketTypeId,
        quantity: i.quantity,
        attendees: i.attendees.map((a) => ({
          ...a,
          email: a.email || undefined,
          phone: a.phone || undefined
        }))
      }))
    });

    if (result.mode === "free") {
      // Free events: issue tickets, generate the PDF, then send SMS and email
      await fulfilOrder(result.orderId, "orders");
    }

    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input", details: e.errors }, { status: 400 });
    }
    const msg = e?.message || "internal_error";
    const status = ["sold_out", "booking_closed", "booking_not_open_yet", "event_not_open"].includes(msg)
      ? 409
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
