import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { generateUniqueOrganizerSlug } from "@/lib/slug";

const Body = z.object({
  displayName: z.string().min(2).max(120),
  country: z.string().length(2),
  currency: z.string().length(3),
  timezone: z.string().max(60),
  bio: z.string().max(2000).optional()
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const data = Body.parse(await req.json());
    const existing = await db.organizer.findUnique({ where: { userId: user.id } });
    if (existing) return NextResponse.json(existing);

    const slug = await generateUniqueOrganizerSlug(data.displayName);
    const organizer = await db.organizer.create({
      data: {
        userId: user.id,
        displayName: data.displayName,
        slug,
        bio: data.bio
      }
    });
    // Update the user with country/currency/tz + promote role
    await db.user.update({
      where: { id: user.id },
      data: {
        country: data.country,
        currency: data.currency,
        timezone: data.timezone,
        role: user.role === "ATTENDEE" ? "ORGANIZER" : user.role
      }
    });
    return NextResponse.json(organizer, { status: 201 });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
