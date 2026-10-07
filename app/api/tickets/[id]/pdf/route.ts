import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { renderTicketPdfBuffer } from "@/lib/services/render";
import { rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Always-working ticket download. Renders the PDF on demand, so it never expires and
 * does not depend on a stored link. Access needs either the order id (from the buyer's
 * confirmation page) or the ticket reference code.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  if (!(await rateLimit(`pdf:${ip}`, 20, 60, "ticket-pdf"))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const url = new URL(req.url);
  const orderId = url.searchParams.get("order");
  const ref = url.searchParams.get("ref")?.trim().toUpperCase();

  const ticket = await db.ticket.findUnique({
    where: { id: params.id },
    select: { id: true, orderId: true, visibleRef: true, status: true },
  });
  const allowed =
    !!ticket &&
    ((!!orderId && ticket.orderId === orderId) || (!!ref && ticket.visibleRef === ref));
  if (!ticket || !allowed) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (ticket.status === "PENDING_PAYMENT" || ticket.status === "CANCELLED" || ticket.status === "REFUNDED") {
    return NextResponse.json({ error: "ticket_not_active" }, { status: 403 });
  }

  try {
    const pdf = await renderTicketPdfBuffer(ticket.id);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="${ticket.visibleRef}.pdf"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("[tickets/pdf] render failed", e);
    return NextResponse.json({ error: "render_failed" }, { status: 500 });
  }
}
