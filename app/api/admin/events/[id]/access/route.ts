import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

/**
 * Superadmin override on a finished event: reopen it for a while so something
 * can be fixed or a late guest let in, close it early, or clear the override
 * and let the dates decide again.
 */
const Body = z.object({
  action: z.enum(["REOPEN", "CLOSE", "CLEAR"]),
  /** REOPEN only: how long the window stays open. */
  hours: z.number().int().min(1).max(720).default(24),
  note: z.string().max(300).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireRole(["ADMIN", "SUPER_ADMIN"], req);
    const { action, hours, note } = Body.parse(await req.json());

    const event = await db.event.findUnique({ where: { id: params.id }, select: { id: true, title: true } });
    if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

    const data =
      action === "REOPEN"
        ? { reopenedUntil: new Date(Date.now() + hours * 3600_000), forceClosed: false }
        : action === "CLOSE"
          ? { forceClosed: true, reopenedUntil: null }
          : { forceClosed: false, reopenedUntil: null };

    const updated = await db.event.update({ where: { id: event.id }, data });

    await db.adminLog.create({
      data: {
        actorId: admin.id,
        action: `EVENT_${action}`,
        target: event.id,
        meta: { title: event.title, hours: action === "REOPEN" ? hours : undefined, note },
      },
    });

    return NextResponse.json({
      ok: true,
      reopenedUntil: updated.reopenedUntil,
      forceClosed: updated.forceClosed,
    });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Bad request." }, { status: 400 });
    console.error("[admin/events/:id/access]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
