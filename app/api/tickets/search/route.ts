import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireScannerForEvent } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const eventId = url.searchParams.get("eventId");

  if (!q || q.length < 2) {
    return NextResponse.json({ error: "Enter at least 2 characters" }, { status: 400 });
  }
  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  await requireScannerForEvent(eventId, req);

  let tickets: any[] = [];

  // Exact ref match
  const byRef = await db.ticket.findMany({
    where: { eventId, visibleRef: q.toUpperCase() },
    include: { attendee: true, ticketType: true },
  });
  if (byRef.length > 0) {
    tickets = byRef;
  }

  // Partial ref
  if (tickets.length === 0) {
    const byPartialRef = await db.ticket.findMany({
      where: { eventId, visibleRef: { contains: q.toUpperCase() } },
      include: { attendee: true, ticketType: true },
      take: 20,
    });
    if (byPartialRef.length > 0) tickets = byPartialRef;
  }

  // By phone
  if (tickets.length === 0) {
    const byPhone = await db.ticket.findMany({
      where: { eventId, attendee: { phone: { contains: q } } },
      include: { attendee: true, ticketType: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    if (byPhone.length > 0) tickets = byPhone;
  }

  // By email
  if (tickets.length === 0) {
    const byEmail = await db.ticket.findMany({
      where: { eventId, attendee: { email: { contains: q.toLowerCase(), mode: "insensitive" } } },
      include: { attendee: true, ticketType: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    if (byEmail.length > 0) tickets = byEmail;
  }

  // By name
  if (tickets.length === 0) {
    const byName = await db.ticket.findMany({
      where: { eventId, attendee: { fullName: { contains: q, mode: "insensitive" } } },
      include: { attendee: true, ticketType: true },
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
    })),
  });
}
