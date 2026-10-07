import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const Body = z.object({
  fullName: z.string().max(120).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  displayName: z.string().min(2).max(120).optional(),
  bio: z.string().max(2000).nullable().optional(),
  website: z.string().max(500).nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const data = Body.parse(await req.json());

    await db.user.update({
      where: { id: user.id },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
      },
    });

    if (data.displayName !== undefined) {
      const organizer = await db.organizer.findUnique({ where: { userId: user.id } });
      if (organizer) {
        await db.organizer.update({
          where: { id: organizer.id },
          data: {
            displayName: data.displayName,
            ...(data.bio !== undefined && { bio: data.bio }),
            ...(data.website !== undefined && { website: data.website }),
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    if (e?.code === "P2002") return NextResponse.json({ error: "Phone number already in use." }, { status: 409 });
    console.error("[settings]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
