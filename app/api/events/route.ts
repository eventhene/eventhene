import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOrganizer } from "@/lib/auth";
import { generateUniqueEventSlug } from "@/lib/slug";
import { generateShortCode } from "@/lib/refs";

const TicketTypeSchema = z.object({
  name: z.string().min(1).max(60),
  priceMinor: z.number().int().min(0),
  quantity: z.number().int().min(1),
  notes: z.string().max(200).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0)
});

const AttendeeFieldSchema = z.object({
  key: z.enum(["FULL_NAME", "PHONE", "EMAIL", "GENDER", "CITY", "ADDRESS", "ORGANIZATION", "AGE_RANGE", "EMERGENCY_CONTACT", "CUSTOM"]),
  label: z.string().min(1).max(100),
  type: z.enum(["TEXT", "EMAIL", "PHONE", "SELECT", "NUMBER", "DATE", "TEXTAREA"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  sortOrder: z.number().int().default(0)
});

const CreateEventBody = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(10000),
  category: z.string().max(50),
  venue: z.string().min(1).max(200),
  city: z.string().max(100).optional(),
  country: z.string().length(2),
  currency: z.string().length(3),
  timezone: z.string().max(60),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  bookingOpensAt: z.coerce.date(),
  bookingClosesAt: z.coerce.date(),
  flyerUrl: z.string().url().optional().or(z.literal("")),
  type: z.enum(["PAID", "FREE"]),
  buyerPaysFee: z.boolean().default(true),
  couponCode: z.string().max(30).optional(),
  ticketTypes: z.array(TicketTypeSchema).min(1).max(20),
  attendeeFields: z.array(AttendeeFieldSchema).min(1).max(30)
});

export async function POST(req: NextRequest) {
  try {
    const { organizer } = await requireOrganizer(req);
    const body = CreateEventBody.parse(await req.json());

    if (body.endsAt <= body.startsAt) {
      return NextResponse.json({ error: "endsAt must be after startsAt" }, { status: 400 });
    }
    if (body.bookingClosesAt > body.endsAt) {
      return NextResponse.json({ error: "bookingClosesAt cannot be after endsAt" }, { status: 400 });
    }

    const slug = await generateUniqueEventSlug(body.title);
    const shortCode = generateShortCode(body.title);

    // For free events, all prices must be 0
    if (body.type === "FREE" && body.ticketTypes.some((t) => t.priceMinor !== 0)) {
      return NextResponse.json({ error: "Free events cannot have priced tickets" }, { status: 400 });
    }

    // Check coupon code - valid coupon auto-publishes the event
    let autoPublish = false;
    let claimedCouponId: string | null = null;
    if (body.couponCode) {
      const code = body.couponCode.toUpperCase().trim();
      const coupon = await db.coupon.findUnique({ where: { code } });
      if (!coupon) return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });
      }
      // Claim one use atomically so two simultaneous requests cannot both spend the last use.
      const claimed = await db.$executeRaw`UPDATE "Coupon" SET "usedCount" = "usedCount" + 1 WHERE id = ${coupon.id} AND "usedCount" < "maxUses"`;
      if (claimed === 0) {
        return NextResponse.json({ error: "This coupon has been fully used" }, { status: 400 });
      }
      claimedCouponId = coupon.id;
      autoPublish = true;
    }

    const event = await db.event.create({
      data: {
        organizerId: organizer.id,
        title: body.title,
        slug,
        shortCode,
        description: body.description,
        category: body.category,
        venue: body.venue,
        city: body.city,
        country: body.country,
        currency: body.currency,
        timezone: body.timezone,
        startsAt: body.startsAt,
        endsAt: body.endsAt,
        bookingOpensAt: body.bookingOpensAt,
        bookingClosesAt: body.bookingClosesAt,
        flyerUrl: body.flyerUrl || null,
        type: body.type,
        buyerPaysFee: body.buyerPaysFee,
        couponCode: body.couponCode?.toUpperCase().trim() || null,
        status: autoPublish ? "PUBLISHED" : "DRAFT",
        publishedAt: autoPublish ? new Date() : null,
        ticketTypes: { create: body.ticketTypes },
        attendeeFields: { create: body.attendeeFields.map((f) => ({ ...f, options: f.options ?? [] })) }
      },
      include: { ticketTypes: true, attendeeFields: true }
    }).catch(async (err) => {
      if (claimedCouponId) {
        await db.$executeRaw`UPDATE "Coupon" SET "usedCount" = GREATEST("usedCount" - 1, 0) WHERE id = ${claimedCouponId}`;
      }
      throw err;
    });

    return NextResponse.json(event, { status: 201 });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "invalid_input", details: e.errors }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
