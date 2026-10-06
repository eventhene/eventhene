import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { sendEmail, freeEventEditsRequestedEmail } from "@/lib/email";

const Body = z.object({ note: z.string().min(2).max(2000) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireRole(["ADMIN", "SUPER_ADMIN"], req);
    const { note } = Body.parse(await req.json());
    const event = await db.event.findUnique({
      where: { id: params.id },
      include: { organizer: { include: { user: true } } }
    });
    if (!event) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const updated = await db.event.update({
      where: { id: event.id },
      data: { status: "EDITS_REQUESTED", adminNote: note }
    });
    await db.adminLog.create({
      data: { actorId: admin.id, action: "REQUEST_EDITS", target: event.id, meta: { note } }
    });
    if (event.organizer.user.email) {
      await sendEmail({
        to: event.organizer.user.email,
        subject: `Quick edits before "${event.title}" goes live`,
        html: freeEventEditsRequestedEmail({
          eventTitle: event.title,
          note,
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/events/${event.id}`
        })
      }).catch(() => {});
    }
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
