import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireEventOwner, requireOrganizer } from "@/lib/auth";
import { createCampaign, previewAudience, runCampaign, InsufficientCreditsError, SmsFrozenError } from "@/lib/services/sms";
import { smsSegments } from "@/lib/sms/segments";
import { sanitizeSmsContent } from "@/lib/sms/sanitize";
import { resolveSenderId } from "@/lib/sms/sender";

const Body = z.object({
  name: z.string().min(2).max(80),
  message: z.string().min(2).max(1600),
  audience: z.string().min(2).max(80),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, event } = await requireEventOwner(params.id);
    const { organizer } = await requireOrganizer(req);
    const data = Body.parse(await req.json());

    const campaign = await createCampaign({
      organizerId: organizer.id,
      createdById: user.id,
      eventId: event.id,
      name: data.name,
      message: data.message,
      audience: data.audience,
    });

    const final = await runCampaign(campaign.id);
    return NextResponse.json(final, { status: 201 });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Please check your inputs." }, { status: 400 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (e instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { error: `Not enough SMS credits. You need ${e.needed} but have ${e.have}. Top up to send.`, code: "insufficient_credits", needed: e.needed, have: e.have },
        { status: 402 }
      );
    }
    if (e instanceof SmsFrozenError) {
      return NextResponse.json({ error: "SMS sending is frozen on your account.", code: "sms_frozen" }, { status: 403 });
    }
    return NextResponse.json({ error: e.message || "sms_failed" }, { status: 400 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, event } = await requireEventOwner(params.id);
    const { organizer } = await requireOrganizer(req);
    const url = new URL(req.url);
    const audience = url.searchParams.get("audience") || "ALL";
    const draftMessage = url.searchParams.get("message") || "";

    const recipients = await previewAudience({ eventId: event.id, audience });
    const safe = sanitizeSmsContent(draftMessage);
    const seg = smsSegments(safe);
    const senderIdUsed = await resolveSenderId(organizer.id);

    return NextResponse.json({
      count: recipients.length,
      sample: recipients.slice(0, 5),
      segments: seg,
      senderId: senderIdUsed,
      balance: organizer.smsBalance,
      estimatedCredits: seg.segments * recipients.length,
      sanitized: safe,
    });
  } catch (e: any) {
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
