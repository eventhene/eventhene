import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireEventOwner } from "@/lib/auth";
import {
  createCampaign,
  prepareCampaign,
  processCampaign,
  specFromEventAudience,
  InsufficientCreditsError,
  SmsFrozenError,
} from "@/lib/services/sms";
import { resolveSenderId } from "@/lib/sms/sender";

export const maxDuration = 60;

const Body = z.object({
  name: z.string().min(2).max(80),
  message: z.string().min(2).max(1600),
  audience: z.string().min(2).max(80),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, event } = await requireEventOwner(params.id, req);
    const organizer = await db.organizer.findUniqueOrThrow({ where: { id: event.organizerId } });
    const data = Body.parse(await req.json());

    const { campaign } = await createCampaign({
      organizerId: event.organizerId,
      createdById: user.id,
      eventId: event.id,
      name: data.name,
      message: data.message,
      spec: { ...specFromEventAudience(event.id, data.audience), contextEventId: event.id },
      audienceLabel: data.audience,
    });

    const result = await processCampaign(campaign.id, { maxRecipients: 400, deadlineMs: 45_000 });
    return NextResponse.json(
      {
        campaignId: campaign.id,
        status: result.status,
        totalSent: result.sent,
        totalFailed: result.failed,
        remaining: result.remaining,
        organizerId: organizer.id,
      },
      { status: 201 }
    );
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
    const { event } = await requireEventOwner(params.id, req);
    const organizer = await db.organizer.findUniqueOrThrow({ where: { id: event.organizerId } });
    const url = new URL(req.url);
    const audience = url.searchParams.get("audience") || "ALL";
    const draftMessage = url.searchParams.get("message") || "";

    const prepared = await prepareCampaign({
      organizerId: event.organizerId,
      message: draftMessage,
      spec: { ...specFromEventAudience(event.id, audience), contextEventId: event.id },
    });
    const senderIdUsed = await resolveSenderId(organizer.id);

    return NextResponse.json({
      count: prepared.items.length,
      sample: prepared.items.slice(0, 5).map((i) => ({ phone: i.recipient.phone, name: i.recipient.name })),
      segments: prepared.templateSegments,
      senderId: senderIdUsed,
      balance: organizer.smsBalance,
      estimatedCredits: prepared.totalCredits,
      sanitized: prepared.safeTemplate,
    });
  } catch (e: any) {
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
