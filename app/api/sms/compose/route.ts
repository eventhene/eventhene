import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganizer } from "@/lib/auth";
import { resolveSenderId } from "@/lib/sms/sender";
import { DEFAULT_TITLE_OPTIONS, type TitleOptions } from "@/lib/sms/titles";
import {
  prepareCampaign,
  createCampaign,
  InsufficientCreditsError,
  SmsFrozenError,
  type AudienceSpec,
} from "@/lib/services/sms";

const AudienceSchema = z.object({
  registered: z
    .object({
      eventId: z.string().nullish(),
      allEvents: z.boolean().optional(),
      filter: z.string().max(80).optional(),
    })
    .nullish(),
  listIds: z.array(z.string()).max(50).optional(),
  phones: z.array(z.string().max(30)).max(500).optional(),
  contextEventId: z.string().nullish(),
});

const TitlesSchema = z
  .object({
    enabled: z.boolean(),
    male: z.string().max(16),
    female: z.string().max(16),
    unknown: z.enum(["none", "male", "female"]),
    useNameGuess: z.boolean(),
  })
  .optional();

const PreviewBody = z.object({
  preview: z.literal(true),
  audience: AudienceSchema,
  message: z.string().max(1600).optional(),
  titles: TitlesSchema,
});

const SendBody = z.object({
  name: z.string().min(1).max(80),
  message: z.string().min(1).max(1600),
  audience: AudienceSchema,
  titles: TitlesSchema,
});

function describeAudience(spec: AudienceSpec): string {
  const parts: string[] = [];
  if (spec.registered?.allEvents) parts.push("All registered");
  else if (spec.registered?.eventId) parts.push("Event registered");
  if (spec.listIds?.length) parts.push(`${spec.listIds.length} list${spec.listIds.length > 1 ? "s" : ""}`);
  if (spec.phones?.length) parts.push(`${spec.phones.length} typed number${spec.phones.length > 1 ? "s" : ""}`);
  return parts.join(" + ") || "Custom";
}

export async function POST(req: NextRequest) {
  try {
    const { user, organizer } = await requireOrganizer(req);
    const body = await req.json();

    if (body.preview) {
      const { audience, message, titles } = PreviewBody.parse(body);
      const prepared = await prepareCampaign({
        organizerId: organizer.id,
        message: message || "",
        spec: audience as AudienceSpec,
        titles: (titles as TitleOptions) ?? DEFAULT_TITLE_OPTIONS,
      });
      const senderId = await resolveSenderId(organizer.id);

      const usesEventTags = /\{(event|date|venue)\}/i.test(prepared.safeTemplate);
      const missingEventDetails = usesEventTags
        ? prepared.items.filter((i) => !i.recipient.event).length
        : 0;

      return NextResponse.json({
        count: prepared.items.length,
        invalid: prepared.audience.invalid,
        duplicates: prepared.audience.duplicates,
        skippedEmpty: prepared.skippedEmpty,
        breakdown: prepared.audience.breakdown,
        segments: prepared.templateSegments,
        estimatedCredits: prepared.totalCredits,
        balance: organizer.smsBalance,
        frozen: organizer.smsFrozen,
        senderId,
        sanitized: prepared.safeTemplate,
        titles: prepared.titles,
        missingEventDetails,
        sample: prepared.items.slice(0, 6).map((i) => ({
          phone: i.recipient.phone,
          name: i.recipient.name,
          content: i.content,
        })),
      });
    }

    const { name, message, audience, titles } = SendBody.parse(body);
    const { campaign, prepared } = await createCampaign({
      organizerId: organizer.id,
      createdById: user.id,
      name,
      message,
      spec: audience as AudienceSpec,
      audienceLabel: describeAudience(audience as AudienceSpec),
      titles: (titles as TitleOptions) ?? DEFAULT_TITLE_OPTIONS,
    });

    return NextResponse.json({
      ok: true,
      campaignId: campaign.id,
      total: prepared.items.length,
      credits: prepared.totalCredits,
    });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: e.message || "forbidden" }, { status: 403 });
    if (e instanceof InsufficientCreditsError) return NextResponse.json({ error: e.message }, { status: 402 });
    if (e instanceof SmsFrozenError) return NextResponse.json({ error: e.message }, { status: 403 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Please check your message and audience." }, { status: 400 });
    console.error("[sms/compose]", e);
    return NextResponse.json({ error: e?.message || "internal_error" }, { status: 500 });
  }
}
