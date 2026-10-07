import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/ratelimit";
import { getCurrentUser } from "@/lib/auth";

const Body = z.object({
  serviceType: z.enum(["SOCIAL_MEDIA", "GRAPHIC_DESIGN", "LIVESTREAM", "PHOTOGRAPHY", "MEDIA_COVERAGE", "BLOGGING", "MARKETING"]),
  contactName: z.string().min(1).max(120),
  contactEmail: z.string().email(),
  contactPhone: z.string().max(40).optional(),
  message: z.string().min(5).max(2000),
  eventId: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "anon";
    const ok = await rateLimit(`inquiry:${ip}`, 5, 60, "inquiry");
    if (!ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

    const data = Body.parse(await req.json());
    const user = await getCurrentUser(req).catch(() => null);
    const organizer = user ? await db.organizer.findUnique({ where: { userId: user.id } }) : null;
    const inquiry = await db.serviceInquiry.create({
      data: { ...data, organizerId: organizer?.id ?? null },
    });

    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `New service inquiry: ${data.serviceType}`,
        html: `<p>From ${data.contactName} (${data.contactEmail})</p><p>${data.message}</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/superadmin/services">View in admin</a></p>`
      }).catch(() => {});
    }
    return NextResponse.json({ id: inquiry.id }, { status: 201 });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
