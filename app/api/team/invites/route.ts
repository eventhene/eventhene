import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganizerOwner } from "@/lib/auth";
import { createTeamInvite, inviteLink } from "@/lib/services/team";

const Body = z.object({
  phone: z.string().min(7).max(20),
  role: z.enum(["MANAGER", "SCANNER"]),
  eventIds: z.array(z.string()).max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { user, organizer } = await requireOrganizerOwner(req);
    const body = Body.parse(await req.json());
    const { invite, smsSent, smsError } = await createTeamInvite({
      organizerId: organizer.id,
      organizerName: organizer.displayName,
      invitedById: user.id,
      phone: body.phone,
      role: body.role,
      eventIds: body.eventIds,
    });
    return NextResponse.json(
      { ok: true, id: invite.id, smsSent, smsError, link: inviteLink(invite.token) },
      { status: 201 }
    );
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: e.message || "forbidden" }, { status: 403 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Enter a phone number and choose a role." }, { status: 400 });
    return NextResponse.json({ error: e?.message || "internal_error" }, { status: 400 });
  }
}
