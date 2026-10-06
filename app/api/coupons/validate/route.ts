import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.toUpperCase().trim();
  if (!code) return NextResponse.json({ valid: false, reason: "No code provided" });

  const coupon = await db.coupon.findUnique({ where: { code } });
  if (!coupon) return NextResponse.json({ valid: false, reason: "Invalid coupon code" });
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, reason: "This coupon has expired" });
  }
  if (coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ valid: false, reason: "This coupon has been fully used" });
  }

  return NextResponse.json({ valid: true, code: coupon.code });
}
