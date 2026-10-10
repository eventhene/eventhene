import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrganizerOwner } from "@/lib/auth";
import { actorFor, logAudit } from "@/lib/audit";
import { snapshotDeleted } from "@/lib/recycle";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, organizer } = await requireOrganizerOwner(req);
    const member = await db.teamMember.findUnique({ where: { id: params.id }, include: { user: { select: { fullName: true, email: true } } } });
    if (!member || member.organizerId !== organizer.id) {
      return NextResponse.json({ error: "Team member not found." }, { status: 404 });
    }
    const actor = actorFor(user, organizer.userId);
    const { user: person, ...row } = member;
    const label = `${person.fullName || person.email} (${member.role.toLowerCase()})`;

    const binId = await snapshotDeleted({ organizerId: organizer.id, kind: "team_member", recordId: member.id, label, snapshot: { member: row }, actor });
    await db.teamMember.delete({ where: { id: member.id } });
    await logAudit({ organizerId: organizer.id, actor, action: "team_member.delete", targetType: "team_member", targetId: member.id, label: `Removed team member ${label}`, meta: { recoverable: !!binId } });
    return NextResponse.json({ ok: true, binId });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: e.message || "forbidden" }, { status: 403 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
