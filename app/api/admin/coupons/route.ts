import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import crypto from "crypto";

const CreateBody = z.object({
  code: z.string().min(3).max(30).optional(),
  note: z.string().max(200).optional(),
  maxUses: z.number().int().min(1).max(10000).default(1),
  expiresAt: z.string().datetime().optional(),
});

function generateCode(): string {
  return "EH-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const data = CreateBody.parse(await req.json());
    const code = (data.code || generateCode()).toUpperCase().replace(/\s/g, "");

    const existing = await db.coupon.findUnique({ where: { code } });
    if (existing) return NextResponse.json({ error: "Code already exists" }, { status: 409 });

    const coupon = await db.coupon.create({
      data: {
        code,
        note: data.note,
        maxUses: data.maxUses,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        createdBy: admin.id,
      },
    });
    return NextResponse.json(coupon, { status: 201 });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const coupons = await db.coupon.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ coupons });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
