import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireEventOwner } from "@/lib/auth";
import { actorFor, logAudit } from "@/lib/audit";

/** Undo a check-in (for testing, or a mis-scan) without deleting or re-registering the guest. */
export async function POST(req: NextRequest, { params }: { params: { id: string; ticketId: string } }) {
  try {
    const { user, event } = await requireEventOwner(params.id, req);
    const ticket = await db.ticket.findUnique({ where: { id: params.ticketId }, include: { attendee: true } });
    if (!ticket || ticket.eventId !== event.id) return NextResponse.json({ error: "Guest not found." }, { status: 404 });
    if (ticket.status !== "ATTENDED") return NextResponse.json({ error: "This guest is not checked in." }, { status: 409 });

    const owner = await db.organizer.findUniqueOrThrow({ where: { id: event.organizerId }, select: { userId: true } });
    const actor = actorFor(user, owner.userId);
    const back = event.type === "FREE" ? "REGISTERED" : "TICKET_ISSUED";

    const flipped = await db.ticket.updateMany({
      where: { id: ticket.id, status: "ATTENDED" },
      data: { status: back, usedAt: null, scannedByUserId: null },
    });
    if (flipped.count === 0) return NextResponse.json({ error: "This guest is not checked in." }, { status: 409 });

    await db.scanLog.create({
      data: { ticketId: ticket.id, eventId: event.id, scannedById: user.id, result: "CHECKIN_REMOVED" },
    });
    await logAudit({
      organizerId: event.organizerId,
      eventId: event.id,
      actor,
      action: "checkin.remove",
      targetType: "guest",
      targetId: ticket.id,
      label: `Removed the check-in for ${ticket.attendee.fullName} (${ticket.visibleRef})`,
      meta: { previouslyCheckedInAt: ticket.usedAt },
    });
    return NextResponse.json({ ok: true, status: back });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    console.error("[uncheckin]", e);
    return NextResponse.json({ error: "Could not remove the check-in." }, { status: 500 });
  }
}
