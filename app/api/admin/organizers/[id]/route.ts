import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole("SUPER_ADMIN", req);

    const organizer = await db.organizer.findUnique({
      where: { id: params.id },
      include: { _count: { select: { events: true } } },
    });

    if (!organizer) {
      return NextResponse.json({ error: "Organizer not found." }, { status: 404 });
    }

    if (organizer._count.events > 0) {
      await db.event.deleteMany({ where: { organizerId: organizer.id } });
    }

    await db.organizer.delete({ where: { id: organizer.id } });

    await db.user.update({
      where: { id: organizer.userId },
      data: { role: "ATTENDEE" },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    console.error("[admin/organizers/delete]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
