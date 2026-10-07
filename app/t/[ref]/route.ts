import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/** Short link used in ticket SMS: /t/<ref> sends the buyer to their ticket page. */
export async function GET(req: NextRequest, { params }: { params: { ref: string } }) {
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const origin = new URL(req.url).origin;
  if (!(await rateLimit(`short:${ip}`, 30, 60, "short-link"))) {
    return NextResponse.redirect(`${origin}/tickets/lookup`, 307);
  }
  const ref = decodeURIComponent(params.ref).trim().toUpperCase();
  const ticket = await db.ticket.findUnique({ where: { visibleRef: ref }, select: { orderId: true } });
  if (!ticket?.orderId) return NextResponse.redirect(`${origin}/tickets/lookup`, 307);
  return NextResponse.redirect(`${origin}/orders/${ticket.orderId}/success`, 307);
}
