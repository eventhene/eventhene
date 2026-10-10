import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyOtp } from "@/lib/auth/otp";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { markEmailVerified, markPhoneVerified } from "@/lib/auth/verification";
import { rateLimit } from "@/lib/ratelimit";
import { passwordChangedNotice } from "@/lib/auth/security-notices";

const Body = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(8),
  newPassword: z.string().min(8).max(200),
  channel: z.enum(["email", "sms"]).default("email"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "anon";
    const { email, code, newPassword, channel } = Body.parse(await req.json());
    const clean = email.trim().toLowerCase();

    if (!(await rateLimit(ip, 15, 900, "pw-reset-ip")) || !(await rateLimit(clean, 10, 900, "pw-reset-email"))) {
      return NextResponse.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.ok) return NextResponse.json({ error: strength.reason }, { status: 400 });

    const user = await db.user.findUnique({ where: { email: clean } });
    if (!user) return NextResponse.json({ error: "That code is not right." }, { status: 400 });

    const result = await verifyOtp(user.id, channel, code, "reset");
    if (!result.valid) return NextResponse.json({ error: result.reason || "That code is not right." }, { status: 400 });

    const passwordHash = await hashPassword(newPassword);
    await db.user.update({ where: { id: user.id }, data: { passwordHash } });
    // everyone signed in with the old password is signed out
    await db.session.deleteMany({ where: { userId: user.id } });
    // receiving the code proves they own that email or phone
    if (channel === "email") await markEmailVerified(user.id);
    else await markPhoneVerified(user.id);

    passwordChangedNotice(user.email).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Please check the code and your new password." }, { status: 400 });
    console.error("[password reset]", e);
    console.error("[password route]", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
