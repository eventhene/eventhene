import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyOtp } from "@/lib/auth/otp";
import { createSession } from "@/lib/auth/session";
import { headers } from "next/headers";

const Body = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(8),
  channel: z.enum(["email", "sms"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { email, code, channel } = Body.parse(await req.json());
    const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) return NextResponse.json({ error: "No account found." }, { status: 404 });

    const result = await verifyOtp(user.id, channel || "email", code);
    if (!result.valid) {
      return NextResponse.json({ error: result.reason, valid: false }, { status: 400 });
    }

    if (channel === "sms" && !user.phoneVerified) {
      await db.user.update({ where: { id: user.id }, data: { phoneVerified: true } });
    }
    if (!user.emailVerified) {
      await db.user.update({ where: { id: user.id }, data: { emailVerified: true } });
    }

    const h = headers();
    const sessionInfo = await createSession(user.id, {
      ip: h.get("x-forwarded-for") ?? undefined,
      userAgent: h.get("user-agent") ?? undefined,
    });

    const res = NextResponse.json({ ok: true, valid: true, user: { id: user.id, role: user.role } });
    res.cookies.set(sessionInfo.cookieName, sessionInfo.jwt, sessionInfo.cookieOptions);
    console.log("[verify-otp] session created for", user.email, "cookie:", sessionInfo.cookieName, "secure:", sessionInfo.cookieOptions.secure, "sameSite:", sessionInfo.cookieOptions.sameSite, "path:", sessionInfo.cookieOptions.path);
    return res;
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    console.error("[verify-otp]", e);
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}
