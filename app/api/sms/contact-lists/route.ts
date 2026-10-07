import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOrganizer } from "@/lib/auth";
import { importContacts } from "@/lib/sms/contacts";

const CreateBody = z.object({
  name: z.string().trim().min(1).max(60),
  contacts: z
    .array(z.object({ name: z.string().max(80).nullish(), phone: z.string().max(30) }))
    .max(5000)
    .optional(),
});

function handleError(e: any, tag: string) {
  if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (e?.name === "ForbiddenError") return NextResponse.json({ error: e.message || "forbidden" }, { status: 403 });
  if (e instanceof z.ZodError) return NextResponse.json({ error: "Please check the list name and contacts." }, { status: 400 });
  console.error(tag, e);
  return NextResponse.json({ error: e?.message || "internal_error" }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    const { organizer } = await requireOrganizer(req);
    const lists = await db.contactList.findMany({
      where: { organizerId: organizer.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { contacts: true } } },
    });
    return NextResponse.json({
      lists: lists.map((l) => ({ id: l.id, name: l.name, count: l._count.contacts })),
    });
  } catch (e) {
    return handleError(e, "[sms/contact-lists GET]");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { organizer } = await requireOrganizer(req);
    const { name, contacts } = CreateBody.parse(await req.json());

    const clash = await db.contactList.findUnique({
      where: { organizerId_name: { organizerId: organizer.id, name } },
    });
    if (clash) return NextResponse.json({ error: "You already have a list with that name." }, { status: 409 });

    const list = await db.contactList.create({ data: { organizerId: organizer.id, name } });
    const stats = contacts?.length
      ? await importContacts(list.id, contacts.map((c) => ({ name: c.name, phone: c.phone })))
      : { added: 0, duplicates: 0, invalid: 0, total: 0 };

    return NextResponse.json({ list: { id: list.id, name: list.name, count: stats.total }, stats }, { status: 201 });
  } catch (e) {
    return handleError(e, "[sms/contact-lists POST]");
  }
}
