import { NextRequest, NextResponse } from "next/server";
import { manualCheckIn } from "@/lib/services/tickets";
import { requireScannerForEvent } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ticket = await db.ticket.findUnique({ where: { id: params.id } });
    if (!ticket) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const { user } = await requireScannerForEvent(ticket.eventId);
    const result = await manualCheckIn({ ticketId: ticket.id, scannedById: user.id });
    return NextResponse.json(result);
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
