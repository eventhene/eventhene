import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const ok = await rateLimit(`lookup:${ip}`, 10, 60, "lookup");
  if (!ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();

  if (!q || q.length < 3) {
    return NextResponse.json({ error: "Enter at least 3 characters" }, { status: 400 });
  }

  let tickets: any[] = [];

  // Try exact ref match first
  const byRef = await db.ticket.findMany({
    where: { visibleRef: q.toUpperCase() },
    include: { event: true, attendee: true, ticketType: true },
  });
  if (byRef.length > 0) {
    tickets = byRef;
  }

  // Try partial ref match
  if (tickets.length === 0) {
    const byPartialRef = await db.ticket.findMany({
      where: { visibleRef: { contains: q.toUpperCase() } },
      include: { event: true, attendee: true, ticketType: true },
      take: 20,
    });
    if (byPartialRef.length > 0) tickets = byPartialRef;
  }

  // Try by phone number
  if (tickets.length === 0) {
    const byPhone = await db.ticket.findMany({
      where: { attendee: { phone: { contains: q } } },
      include: { event: true, attendee: true, ticketType: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    if (byPhone.length > 0) tickets = byPhone;
  }

  // Try by email
  if (tickets.length === 0) {
    const byEmail = await db.ticket.findMany({
      where: { attendee: { email: { contains: q.toLowerCase(), mode: "insensitive" } } },
      include: { event: true, attendee: true, ticketType: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    if (byEmail.length > 0) tickets = byEmail;
  }

  // Try by name
  if (tickets.length === 0) {
    const byName = await db.ticket.findMany({
      where: { attendee: { fullName: { contains: q, mode: "insensitive" } } },
      include: { event: true, attendee: true, ticketType: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    tickets = byName;
  }

  return NextResponse.json({
    tickets: tickets.map((t) => ({
      id: t.id,
      visibleRef: t.visibleRef,
      status: t.status,
      attendeeName: t.attendee.fullName,
      attendeePhone: t.attendee.phone,
      ticketType: t.ticketType.name,
      eventTitle: t.event.title,
      eventSlug: t.event.slug,
      pdfUrl: t.pdfUrl,
    })),
  });
}
