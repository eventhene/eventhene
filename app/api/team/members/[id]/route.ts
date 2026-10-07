import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrganizerOwner } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { organizer } = await requireOrganizerOwner(req);
    const member = await db.teamMember.findUnique({ where: { id: params.id } });
    if (!member || member.organizerId !== organizer.id) {
      return NextResponse.json({ error: "Team member not found." }, { status: 404 });
    }
    await db.teamMember.delete({ where: { id: member.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: e.message || "forbidden" }, { status: 403 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
