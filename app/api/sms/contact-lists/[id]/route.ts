import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOrganizer } from "@/lib/auth";

function handleError(e: any, tag: string) {
  if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (e?.name === "ForbiddenError") return NextResponse.json({ error: e.message || "forbidden" }, { status: 403 });
  if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  console.error(tag, e);
  return NextResponse.json({ error: e?.message || "internal_error" }, { status: 500 });
}

async function ownList(req: NextRequest, id: string) {
  const { organizer } = await requireOrganizer(req);
  const list = await db.contactList.findUnique({ where: { id } });
  if (!list || list.organizerId !== organizer.id) return null;
  return list;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const list = await ownList(req, params.id);
    if (!list) return NextResponse.json({ error: "List not found." }, { status: 404 });
    const contacts = await db.contact.findMany({
      where: { listId: list.id },
      orderBy: { createdAt: "desc" },
      take: 3000,
      select: { id: true, name: true, phone: true },
    });
    const count = await db.contact.count({ where: { listId: list.id } });
    return NextResponse.json({ id: list.id, name: list.name, count, contacts });
  } catch (e) {
    return handleError(e, "[sms/contact-lists/:id GET]");
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const list = await ownList(req, params.id);
    if (!list) return NextResponse.json({ error: "List not found." }, { status: 404 });
    const { name } = z.object({ name: z.string().trim().min(1).max(60) }).parse(await req.json());
    const clash = await db.contactList.findFirst({
      where: { organizerId: list.organizerId, name, NOT: { id: list.id } },
    });
    if (clash) return NextResponse.json({ error: "You already have a list with that name." }, { status: 409 });
    await db.contactList.update({ where: { id: list.id }, data: { name } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e, "[sms/contact-lists/:id PATCH]");
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const list = await ownList(req, params.id);
    if (!list) return NextResponse.json({ error: "List not found." }, { status: 404 });
    await db.contactList.delete({ where: { id: list.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e, "[sms/contact-lists/:id DELETE]");
  }
}
