import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireEventOwner, requireOrganizer } from "@/lib/auth";
import { createCampaign, previewAudience, runCampaign } from "@/lib/services/sms";

const Body = z.object({
  name: z.string().min(2).max(80),
  senderId: z.string().min(2).max(11),
  message: z.string().min(2).max(640),
  audience: z.string().min(2).max(80),
  runNow: z.boolean().default(true),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, event } = await requireEventOwner(params.id);
    const { organizer } = await requireOrganizer();
    const data = Body.parse(await req.json());

    const campaign = await createCampaign({
      organizerId: organizer.id,
      createdById: user.id,
      eventId: event.id,
      name: data.name,
      senderId: data.senderId,
      message: data.message,
      audience: data.audience,
    });

    if (data.runNow) {
      const final = await runCampaign(campaign.id);
      return NextResponse.json(final, { status: 201 });
    }
    return NextResponse.json(campaign, { status: 201 });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ error: e.message || "sms_failed" }, { status: 400 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireEventOwner(params.id);
    const url = new URL(req.url);
    const audience = url.searchParams.get("audience") || "ALL";
    const recipients = await previewAudience(params.id, audience);
    return NextResponse.json({ count: recipients.length, sample: recipients.slice(0, 5) });
  } catch (e: any) {
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
