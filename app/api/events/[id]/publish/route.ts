import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireEventOwner } from "@/lib/auth";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const { event } = await requireEventOwner(params.id);
    if (event.status === "PUBLISHED") {
      return NextResponse.json(event);
    }
    const nextStatus = event.type === "FREE" ? "PENDING_APPROVAL" : "PUBLISHED";
    const updated = await db.event.update({
      where: { id: event.id },
      data: {
        status: nextStatus,
        publishedAt: nextStatus === "PUBLISHED" ? new Date() : null
      }
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
