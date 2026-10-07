import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signUpUser } from "@/lib/auth";
import { createAndSendOtp } from "@/lib/auth/otp";

const Body = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(20),
  password: z.string().min(8).max(200),
  country: z.string().length(2).optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().max(60).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const data = Body.parse(await req.json());
    const { user } = await signUpUser({ ...data });

    const channel: "sms" | "email" = user.phone ? "sms" : "email";
    const destination = channel === "sms" ? user.phone! : user.email;
    await createAndSendOtp(user.id, channel, destination);

    return NextResponse.json({
      ok: true,
      needsVerification: true,
      email: user.email,
      phone: user.phone ? "****" + user.phone.slice(-4) : null,
      otpChannel: channel,
    });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Please check your info and try again." }, { status: 400 });
    }
    return NextResponse.json({ error: e.message || "Sign-up failed." }, { status: 400 });
  }
}
