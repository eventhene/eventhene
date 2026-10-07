import { NextRequest, NextResponse } from "next/server";
import { requireOrganizerOwner } from "@/lib/auth";
import { resendTeamInvite } from "@/lib/services/team";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { organizer } = await requireOrganizerOwner(req);
    const result = await resendTeamInvite(params.id, organizer.id, organizer.displayName);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: e.message || "forbidden" }, { status: 403 });
    return NextResponse.json({ error: e?.message || "internal_error" }, { status: 400 });
  }
}
