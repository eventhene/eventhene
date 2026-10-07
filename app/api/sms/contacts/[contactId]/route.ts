import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrganizer } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: { contactId: string } }) {
  try {
    const { organizer } = await requireOrganizer(req);
    const contact = await db.contact.findUnique({
      where: { id: params.contactId },
      include: { list: { select: { organizerId: true } } },
    });
    if (!contact || contact.list.organizerId !== organizer.id) {
      return NextResponse.json({ error: "Contact not found." }, { status: 404 });
    }
    await db.contact.delete({ where: { id: contact.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: e.message || "forbidden" }, { status: 403 });
    console.error("[sms/contacts DELETE]", e);
    return NextResponse.json({ error: e?.message || "internal_error" }, { status: 500 });
  }
}
