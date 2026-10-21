import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";
import { registerAtGate, GateError } from "@/lib/services/gate";

export const maxDuration = 60;

const Body = z.object({
  fullName: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  gender: z.string().max(40).optional(),
  city: z.string().max(80).optional(),
  address: z.string().max(200).optional(),
  organization: z.string().max(120).optional(),
  ageRange: z.string().max(40).optional(),
  emergencyContact: z.string().max(120).optional(),
  customAnswers: z.record(z.any()).optional(),
  ticketTypeId: z.string().optional(),
});

/** Public walk-in registration. The poster QR points here, so arriving means attending. */
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "anon";
    if (!(await rateLimit(`gate:${ip}`, 30, 60, "gate"))) {
      return NextResponse.json({ error: "Too many registrations from this device. Wait a moment." }, { status: 429 });
    }

    const event = await db.event.findUnique({
      where: { gateToken: params.token },
      select: { id: true, gateEnabled: true },
    });
    if (!event) return NextResponse.json({ error: "This gate link is not valid." }, { status: 404 });
    if (!event.gateEnabled) {
      return NextResponse.json({ error: "Gate registration is closed for this event." }, { status: 409 });
    }

    const body = Body.parse(await req.json());
    const { ticketTypeId, ...attendee } = body;
    const result = await registerAtGate({
      eventId: event.id,
      attendee: { ...attendee, email: attendee.email || undefined, phone: attendee.phone || undefined },
      ticketTypeId,
      via: "public",
    });
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (e: any) {
    if (e instanceof GateError) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Please check the details and try again." }, { status: 400 });
    console.error("[gate]", e);
    return NextResponse.json({ error: "Something went wrong. Please see an usher." }, { status: 500 });
  }
}
