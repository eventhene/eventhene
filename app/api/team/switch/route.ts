import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, listAccessibleOrganizers, ORG_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const { organizerId } = z.object({ organizerId: z.string().min(5).max(60) }).parse(await req.json());
    const all = await listAccessibleOrganizers(user.id);
    const hit = all.find((a) => a.organizer.id === organizerId);
    if (!hit) return NextResponse.json({ error: "You do not have access to that organizer." }, { status: 403 });

    const res = NextResponse.json({ ok: true, name: hit.organizer.displayName, access: hit.access });
    res.cookies.set(ORG_COOKIE, organizerId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365, secure: process.env.NODE_ENV === "production" });
    return res;
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
