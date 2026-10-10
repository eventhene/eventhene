import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrganizer } from "@/lib/auth";
import { actorFor, logAudit } from "@/lib/audit";
import { snapshotDeleted } from "@/lib/recycle";

export async function DELETE(req: NextRequest, { params }: { params: { contactId: string } }) {
  try {
    const { user, organizer } = await requireOrganizer(req);
    const contact = await db.contact.findUnique({
      where: { id: params.contactId },
      include: { list: { select: { organizerId: true, name: true } } },
    });
    if (!contact || contact.list.organizerId !== organizer.id) {
      return NextResponse.json({ error: "Contact not found." }, { status: 404 });
    }
    const actor = actorFor(user, organizer.userId);
    const { list, ...row } = contact;
    const label = `${contact.name || "No name"} (${contact.phone}) from ${list.name}`;

    const binId = await snapshotDeleted({ organizerId: organizer.id, kind: "contact", recordId: contact.id, label, snapshot: { contact: row }, actor });
    await db.contact.delete({ where: { id: contact.id } });
    await logAudit({ organizerId: organizer.id, actor, action: "contact.delete", targetType: "contact", targetId: contact.id, label: `Deleted contact ${label}`, meta: { recoverable: !!binId } });
    return NextResponse.json({ ok: true, binId });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: e.message || "forbidden" }, { status: 403 });
    console.error("[sms/contacts DELETE]", e);
    return NextResponse.json({ error: e?.message || "internal_error" }, { status: 500 });
  }
}
