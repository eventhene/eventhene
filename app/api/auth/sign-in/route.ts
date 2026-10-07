import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createAndSendOtp } from "@/lib/auth/otp";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  try {
    const data = Body.parse(await req.json());
    const email = data.email.trim().toLowerCase();
    const user = await db.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "No account with that email. Try signing up." }, { status: 400 });

    const ok = await verifyPassword(data.password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Incorrect password." }, { status: 400 });

    await createAndSendOtp(user.id, "email", user.email);

    return NextResponse.json({
      ok: true,
      needsVerification: true,
      email: user.email,
    });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Please enter a valid email and password." }, { status: 400 });
    }
    return NextResponse.json({ error: e.message || "Sign-in failed." }, { status: 400 });
  }
}
