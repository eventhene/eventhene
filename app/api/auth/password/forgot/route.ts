import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createAndSendOtp } from "@/lib/auth/otp";
import { rateLimit } from "@/lib/ratelimit";

const Body = z.object({
  email: z.string().email(),
  channel: z.enum(["email", "sms"]).optional(),
});

/**
 * Sends a reset code. The answer is always the same whether or not the account exists, so this
 * cannot be used to find out who has an account.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "anon";
    const { email, channel } = Body.parse(await req.json());
    const clean = email.trim().toLowerCase();

    if (!(await rateLimit(ip, 8, 900, "pw-forgot-ip")) || !(await rateLimit(clean, 3, 900, "pw-forgot-email"))) {
      return NextResponse.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
    }

    const user = await db.user.findUnique({ where: { email: clean } });
    const via: "email" | "sms" = channel === "sms" && user?.phone ? "sms" : "email";

    if (user) {
      // hard cap per account so this cannot be used to spam someone with codes or burn SMS
      const recent = await db.otp.count({
        where: { userId: user.id, channel: { startsWith: `${via}:reset` }, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
      });
      if (recent < 5) {
        try {
          await createAndSendOtp(user.id, via, via === "sms" ? user.phone! : user.email, "reset");
        } catch (e) {
          console.error("[password forgot] could not send code", e);
        }
      }
    }
    return NextResponse.json({ ok: true, channel: via });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    console.error("[password route]", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
