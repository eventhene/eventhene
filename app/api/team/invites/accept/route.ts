import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { acceptTeamInvite } from "@/lib/services/team";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const { token } = z.object({ token: z.string().min(10).max(60) }).parse(await req.json());
    const { role } = await acceptTeamInvite(token, { id: user.id, phone: user.phone });
    return NextResponse.json({ ok: true, role, next: role === "MANAGER" ? "/dashboard" : "/scan" });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid invite." }, { status: 400 });
    return NextResponse.json({ error: e?.message || "internal_error" }, { status: 400 });
  }
}
