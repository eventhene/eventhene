import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { grantCredits } from "@/lib/sms/credits";

const Body = z.object({
  organizerId: z.string().min(1),
  amount: z.number().int().min(-100000).max(100000),  // allow negative for adjustments
  kind: z.enum(["GRANT", "PURCHASE", "ADJUST"]).default("GRANT"),
  note: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole(["ADMIN", "SUPER_ADMIN"], req);
    const data = Body.parse(await req.json());

    const result = await grantCredits({
      organizerId: data.organizerId,
      amount: data.amount,
      kind: data.kind,
      note: data.note,
      actorId: admin.id,
    });

    await db.adminLog.create({
      data: {
        actorId: admin.id,
        action: "SMS_CREDITS_GRANT",
        target: data.organizerId,
        meta: { amount: data.amount, kind: data.kind, note: data.note, balanceAfter: result.balanceAfter },
      },
    });

    return NextResponse.json({ ok: true, balanceAfter: result.balanceAfter });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ error: e.message || "internal_error" }, { status: 500 });
  }
}
