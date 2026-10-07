import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganizer } from "@/lib/auth";
import { paystack } from "@/lib/payments/paystack";
import { nanoid } from "nanoid";

const SMS_PACKAGES = [
  { id: "100",  credits: 100,  priceMinor: 1000,  label: "100 credits" },
  { id: "500",  credits: 500,  priceMinor: 4500,  label: "500 credits" },
  { id: "1000", credits: 1000, priceMinor: 8000,  label: "1,000 credits" },
  { id: "5000", credits: 5000, priceMinor: 35000, label: "5,000 credits" },
];

const Body = z.object({
  packageId: z.string(),
});

export async function GET() {
  return NextResponse.json({ packages: SMS_PACKAGES });
}

export async function POST(req: NextRequest) {
  try {
    const { user, organizer } = await requireOrganizer(req);
    const { packageId } = Body.parse(await req.json());

    const pkg = SMS_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) return NextResponse.json({ error: "Invalid package." }, { status: 400 });

    const reference = `sms_${organizer.id}_${nanoid(12)}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const result = await paystack.initialize({
      email: user.email,
      amountMinor: pkg.priceMinor,
      currency: "GHS",
      reference,
      callbackUrl: `${appUrl}/dashboard/sms?topup=success`,
      metadata: {
        type: "sms_topup",
        organizerId: organizer.id,
        userId: user.id,
        credits: pkg.credits,
        packageId: pkg.id,
      },
    });

    return NextResponse.json({
      authorization_url: result.authorization_url,
      reference: result.reference,
    });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    console.error("[sms/topup]", e);
    return NextResponse.json({ error: e.message || "internal_error" }, { status: 500 });
  }
}
