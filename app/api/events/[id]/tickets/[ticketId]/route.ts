import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireEventOwner } from "@/lib/auth";
import { actorFor, logAudit } from "@/lib/audit";
import { snapshotDeleted } from "@/lib/recycle";

const ACTIVE = ["TICKET_ISSUED", "PAID", "REGISTERED", "ATTENDED"];

/** Delete a guest (test registrations, duplicates). Fully recoverable from the recycle bin. */
export async function DELETE(req: NextRequest, { params }: { params: { id: string; ticketId: string } }) {
  try {
    const { user, event } = await requireEventOwner(params.id, req);
    const ticket = await db.ticket.findUnique({
      where: { id: params.ticketId },
      include: { attendee: true, ticketType: true, _count: { select: { scans: true } } },
    });
    if (!ticket || ticket.eventId !== event.id) return NextResponse.json({ error: "Guest not found." }, { status: 404 });

    const owner = await db.organizer.findUniqueOrThrow({ where: { id: event.organizerId }, select: { userId: true } });
    const actor = actorFor(user, owner.userId);

    const otherTickets = await db.ticket.count({ where: { attendeeId: ticket.attendeeId, NOT: { id: ticket.id } } });
    const { attendee, ticketType, _count, ...ticketRow } = ticket;

    // 1) snapshot first (best-effort), 2) then delete
    const binId = await snapshotDeleted({
      organizerId: event.organizerId,
      eventId: event.id,
      kind: "guest",
      recordId: ticket.id,
      label: `${attendee.fullName} (${ticket.visibleRef})`,
      snapshot: { ticket: ticketRow, attendee: otherTickets === 0 ? attendee : null, attendeeStillHasTickets: otherTickets > 0, scanLogs: _count.scans },
      actor,
    });

    await db.$transaction(async (tx) => {
      await tx.scanLog.updateMany({ where: { ticketId: ticket.id }, data: { ticketId: null } });
      await tx.ticket.delete({ where: { id: ticket.id } });
      if (otherTickets === 0) await tx.attendee.delete({ where: { id: ticket.attendeeId } });
      if (ACTIVE.includes(ticket.status)) {
        await tx.ticketType.updateMany({ where: { id: ticket.ticketTypeId, sold: { gt: 0 } }, data: { sold: { decrement: 1 } } });
      }
    });

    await logAudit({
      organizerId: event.organizerId,
      eventId: event.id,
      actor,
      action: "guest.delete",
      targetType: "guest",
      targetId: ticket.id,
      label: `Deleted ${attendee.fullName} (${ticket.visibleRef}) from ${event.title}`,
      meta: { ticketType: ticketType.name, status: ticket.status, wasCheckedIn: ticket.status === "ATTENDED", recoverable: !!binId },
    });

    return NextResponse.json({ ok: true, binId });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    console.error("[guest delete]", e);
    return NextResponse.json({ error: "Could not delete this guest." }, { status: 500 });
  }
}
