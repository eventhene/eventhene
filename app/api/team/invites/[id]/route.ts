import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrganizerOwner } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { organizer } = await requireOrganizerOwner(req);
    const invite = await db.teamInvite.findUnique({ where: { id: params.id } });
    if (!invite || invite.organizerId !== organizer.id) {
      return NextResponse.json({ error: "Invite not found." }, { status: 404 });
    }
    await db.teamInvite.update({ where: { id: invite.id }, data: { status: "REVOKED" } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: e.message || "forbidden" }, { status: 403 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
