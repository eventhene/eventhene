import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOrganizerOwner } from "@/lib/auth";
import { sanitizeSenderId, validateSenderIdFormat } from "@/lib/sms/sender";

const Body = z.object({
  senderId: z.string().min(1).max(32),
});

export async function POST(req: NextRequest) {
  try {
    const { organizer, user } = await requireOrganizerOwner(req);
    const data = Body.parse(await req.json());
    const check = validateSenderIdFormat(data.senderId);
    if (!check.ok) {
      return NextResponse.json({ error: check.reason }, { status: 400 });
    }
    const sender = sanitizeSenderId(data.senderId);

    const updated = await db.organizer.update({
      where: { id: organizer.id },
      data: {
        senderId: sender,
        senderIdStatus: "PENDING",
        senderIdNote: null,
        senderIdApprovedAt: null,
        senderIdApprovedBy: null,
      },
    });

    await db.adminLog.create({
      data: {
        actorId: user.id,
        action: "SENDER_ID_REQUEST",
        target: organizer.id,
        meta: { senderId: sender },
      },
    });

    return NextResponse.json({ senderId: updated.senderId, status: updated.senderIdStatus });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid Sender ID." }, { status: 400 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ error: e.message || "internal_error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { organizer } = await requireOrganizerOwner(req);
    return NextResponse.json({
      senderId: organizer.senderId,
      status: organizer.senderIdStatus,
      note: organizer.senderIdNote,
      approvedAt: organizer.senderIdApprovedAt,
    });
  } catch (e: any) {
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
