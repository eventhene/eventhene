import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"], req);
    const coupon = await db.coupon.findUnique({ where: { id: params.id } });
    if (!coupon) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    await db.coupon.delete({ where: { id: coupon.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
