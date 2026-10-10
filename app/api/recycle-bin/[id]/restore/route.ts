import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireBinAccess, restoreRecord } from "@/lib/recycle";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rec = await db.deletedRecord.findUnique({ where: { id: params.id }, select: { organizerId: true } });
    if (!rec) return NextResponse.json({ ok: false, reason: "That item is no longer in the bin." }, { status: 404 });
    const { actor } = await requireBinAccess(rec.organizerId, req);
    const result = await restoreRecord(params.id, rec.organizerId, actor);
    return NextResponse.json(result, { status: result.ok ? 200 : 409 });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ ok: false, reason: "Please sign in." }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ ok: false, reason: "You do not have access." }, { status: 403 });
    console.error("[recycle-bin restore]", e);
    return NextResponse.json({ ok: false, reason: "Something went wrong." }, { status: 500 });
  }
}
