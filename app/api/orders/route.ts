import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createOrder } from "@/lib/services/orders";
import { fulfilOrder } from "@/lib/services/fulfil";
import { rateLimit } from "@/lib/ratelimit";

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
  buyerName: z.string().min(1).max(120),
  buyerEmail: z.string().email(),
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
    const result = await createOrder({
      eventId: data.eventId,
      buyerName: data.buyerName,
      buyerEmail: data.buyerEmail,
      buyerPhone: data.buyerPhone || undefined,
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
