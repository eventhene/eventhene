import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

const Body = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().max(500).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { organizerId: string } }) {
  try {
    const admin = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const data = Body.parse(await req.json());

    const org = await db.organizer.findUnique({ where: { id: params.organizerId } });
    if (!org) return NextResponse.json({ error: "not_found" }, { status: 404 });

    if (data.action === "APPROVE") {
      if (!org.senderId) {
        return NextResponse.json({ error: "No Sender ID requested yet." }, { status: 400 });
      }
      await db.organizer.update({
        where: { id: org.id },
        data: {
          senderIdStatus: "APPROVED",
          senderIdApprovedAt: new Date(),
          senderIdApprovedBy: admin.id,
          senderIdNote: data.note ?? null,
        },
      });
    } else {
      await db.organizer.update({
        where: { id: org.id },
        data: {
          senderIdStatus: "REJECTED",
          senderIdApprovedAt: null,
          senderIdApprovedBy: admin.id,
          senderIdNote: data.note ?? null,
        },
      });
    }

    await db.adminLog.create({
      data: {
        actorId: admin.id,
        action: data.action === "APPROVE" ? "SENDER_ID_APPROVE" : "SENDER_ID_REJECT",
        target: org.id,
        meta: { senderId: org.senderId, note: data.note },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ error: e.message || "internal_error" }, { status: 500 });
  }
}
