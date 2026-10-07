import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createAndSendOtp } from "@/lib/auth/otp";

const Body = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const { email } = Body.parse(await req.json());
    const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) return NextResponse.json({ error: "No account found." }, { status: 404 });

    const result = await createAndSendOtp(user.id, "email", user.email);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    console.error("[send-otp]", e);
    return NextResponse.json({ error: e.message || "Failed to send code." }, { status: 500 });
  }
}
