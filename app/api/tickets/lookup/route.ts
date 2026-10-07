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

  // Public lookup - only by ticket reference code (not name/phone/email for privacy)
  const tickets = await db.ticket.findMany({
    where: {
      OR: [
        { visibleRef: q.toUpperCase() },
        { visibleRef: { contains: q.toUpperCase() } },
      ],
    },
    include: { event: true, attendee: true, ticketType: true },
    take: 10,
  });

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
