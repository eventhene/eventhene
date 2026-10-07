import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createAndSendOtp } from "@/lib/auth/otp";
import { normalizeGhPhone } from "@/lib/sms/phone";
import { rateLimit } from "@/lib/ratelimit";

const Body = z.object({ phone: z.string().min(7).max(20) });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const ok = await rateLimit(user.id, 5, 600, "phone-verify");
    if (!ok) return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });

    const { phone } = Body.parse(await req.json());
    const normalized = normalizeGhPhone(phone);
    if (!normalized) return NextResponse.json({ error: "Enter a valid Ghana phone number." }, { status: 400 });

    // Save the number on the account if it changed (it must not belong to someone else).
    const local = "0" + normalized.slice(3);
    const current = user.phone ? normalizeGhPhone(user.phone) : null;
    if (current !== normalized) {
      const taken = await db.user.findFirst({
        where: { phone: { in: [normalized, local, "+" + normalized] }, NOT: { id: user.id } },
        select: { id: true },
      });
      if (taken) return NextResponse.json({ error: "That number is already used by another account." }, { status: 409 });
      await db.user.update({ where: { id: user.id }, data: { phone: local, phoneVerified: false } });
    }

    await createAndSendOtp(user.id, "sms", normalized);
    return NextResponse.json({ ok: true, sentTo: "****" + normalized.slice(-4) });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
    return NextResponse.json({ error: e?.message || "Could not send the code." }, { status: 500 });
  }
}
