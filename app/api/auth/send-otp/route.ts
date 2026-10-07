import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createAndSendOtp } from "@/lib/auth/otp";

const Body = z.object({
  email: z.string().email(),
  channel: z.enum(["email", "sms"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const data = Body.parse(await req.json());
    const user = await db.user.findUnique({ where: { email: data.email.trim().toLowerCase() } });
    if (!user) return NextResponse.json({ error: "No account found." }, { status: 404 });

    const channel: "sms" | "email" = (data.channel === "email") ? "email" : (user.phone ? "sms" : "email");
    const destination = channel === "sms" ? user.phone! : user.email;
    const result = await createAndSendOtp(user.id, channel, destination);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    console.error("[send-otp]", e);
    return NextResponse.json({ error: e.message || "Failed to send code." }, { status: 500 });
  }
}
