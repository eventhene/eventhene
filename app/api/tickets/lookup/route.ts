import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const ok = await rateLimit(`lookup:${ip}`, 10, 60, "lookup");
  if (!ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const url = new URL(req.url);
  const ref = url.searchParams.get("ref")?.trim();
  const email = url.searchParams.get("email")?.trim().toLowerCase();

  if (!ref && !email) {
    return NextResponse.json({ error: "ref_or_email_required" }, { status: 400 });
  }

  let tickets;
  if (ref) {
    tickets = await db.ticket.findMany({
      where: { visibleRef: ref.toUpperCase() },
      include: { event: true, attendee: true, ticketType: true }
    });
  } else {
    tickets = await db.ticket.findMany({
      where: { attendee: { email } },
      include: { event: true, attendee: true, ticketType: true },
      orderBy: { createdAt: "desc" },
      take: 50
    });
  }

  return NextResponse.json({
    tickets: tickets.map((t) => ({
      id: t.id,
      visibleRef: t.visibleRef,
      status: t.status,
      attendeeName: t.attendee.fullName,
      eventTitle: t.event.title,
      eventSlug: t.event.slug,
      pdfUrl: t.pdfUrl
    }))
  });
}
