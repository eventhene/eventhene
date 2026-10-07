import { getAppUrl } from "@/lib/app-url";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { sendEmail, freeEventApprovedEmail } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireRole(["ADMIN", "SUPER_ADMIN"], req);
    const event = await db.event.findUnique({
      where: { id: params.id },
      include: { organizer: { include: { user: true } } }
    });
    if (!event) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const updated = await db.event.update({
      where: { id: event.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        rejectionReason: null,
        adminNote: null
      }
    });

    await db.adminLog.create({
      data: { actorId: admin.id, action: "APPROVE_FREE_EVENT", target: event.id }
    });

    if (event.organizer.user.email) {
      await sendEmail({
        to: event.organizer.user.email,
        subject: `🎉 Your event "${event.title}" is live on EventHene`,
        html: freeEventApprovedEmail({
          eventTitle: event.title,
          url: `${getAppUrl()}/events/${event.slug}`
        })
      }).catch(() => {});
    }

    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
