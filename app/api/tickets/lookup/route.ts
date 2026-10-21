import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";

/**
 * Public ticket lookup.
 *
 * Exact reference only, one result, and never a phone number. This used to do a
 * `contains` match and return up to ten tickets with the attendee's name and
 * phone, so typing three letters surfaced other people's tickets. Anyone looking
 * up a ticket already knows its full reference; partial matching only ever helped
 * someone fishing for one.
 */

/** Refs are built as NAME-EVENTCODE-1234, e.g. DOR-APOFIRCO-6948. */
const REF_SHAPE = /^[A-Z]{3}-[A-Z0-9]{1,12}-\d{4}$/;

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  // Tight, because a wrong guess here is someone probing for a stranger's ticket.
  if (!(await rateLimit(`lookup:${ip}`, 10, 600, "lookup"))) {
    return NextResponse.json({ error: "Too many lookups. Please wait a few minutes." }, { status: 429 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim().toUpperCase() ?? "";

  if (!REF_SHAPE.test(q)) {
    return NextResponse.json(
      { error: "Enter the full ticket reference, for example ABC-EVENT-1234." },
      { status: 400 }
    );
  }

  const t = await db.ticket.findUnique({
    where: { visibleRef: q },
    include: { event: true, attendee: true, ticketType: true },
  });

  // Same response either way, so a miss cannot be told apart from a hit that
  // the caller is not allowed to see.
  if (!t) return NextResponse.json({ tickets: [] });

  return NextResponse.json({
    tickets: [
      {
        id: t.id,
        visibleRef: t.visibleRef,
        status: t.status,
        attendeeName: t.attendee.fullName,
        ticketType: t.ticketType.name,
        eventTitle: t.event.title,
        eventSlug: t.event.slug,
        pdfUrl: t.pdfUrl,
      },
    ],
  });
}
