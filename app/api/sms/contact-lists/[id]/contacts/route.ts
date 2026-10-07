import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOrganizer } from "@/lib/auth";
import { importContacts } from "@/lib/sms/contacts";

const Body = z.object({
  contacts: z
    .array(z.object({ name: z.string().max(80).nullish(), phone: z.string().max(30) }))
    .min(1)
    .max(5000),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { organizer } = await requireOrganizer(req);
    const list = await db.contactList.findUnique({ where: { id: params.id } });
    if (!list || list.organizerId !== organizer.id) {
      return NextResponse.json({ error: "List not found." }, { status: 404 });
    }
    const { contacts } = Body.parse(await req.json());
    const stats = await importContacts(
      list.id,
      contacts.map((c) => ({ name: c.name, phone: c.phone }))
    );
    return NextResponse.json({ ok: true, stats });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: e.message || "forbidden" }, { status: 403 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Add at least one contact with a phone number." }, { status: 400 });
    console.error("[sms/contact-lists/:id/contacts]", e);
    return NextResponse.json({ error: e?.message || "internal_error" }, { status: 500 });
  }
}
