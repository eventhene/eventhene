import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

const Body = z.object({
  organizerId: z.string().min(1),
  frozen: z.boolean(),
  note: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole(["ADMIN", "SUPER_ADMIN"], req);
    const data = Body.parse(await req.json());
    await db.organizer.update({
      where: { id: data.organizerId },
      data: { smsFrozen: data.frozen },
    });
    await db.adminLog.create({
      data: {
        actorId: admin.id,
        action: data.frozen ? "SMS_FREEZE" : "SMS_UNFREEZE",
        target: data.organizerId,
        meta: { note: data.note },
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ error: e.message || "internal_error" }, { status: 500 });
  }
}
