import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrganizer } from "@/lib/auth";
import { processCampaign } from "@/lib/services/sms";

export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { organizer } = await requireOrganizer(req);
    const campaign = await db.smsCampaign.findUnique({
      where: { id: params.id },
      select: { id: true, organizerId: true },
    });
    if (!campaign || campaign.organizerId !== organizer.id) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }
    const result = await processCampaign(campaign.id, { maxRecipients: 60, deadlineMs: 40_000 });
    return NextResponse.json(result);
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    console.error("[sms/campaigns/run]", e);
    return NextResponse.json({ error: e?.message || "internal_error" }, { status: 500 });
  }
}
