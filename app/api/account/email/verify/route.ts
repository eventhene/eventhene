import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { verifyOtp } from "@/lib/auth/otp";
import { markEmailVerified } from "@/lib/auth/verification";
import { rateLimit } from "@/lib/ratelimit";

const Body = z.object({ code: z.string().min(4).max(8) });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const ok = await rateLimit(user.id, 12, 600, "email-verify-code");
    if (!ok) return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });

    const { code } = Body.parse(await req.json());
    const result = await verifyOtp(user.id, "email", code);
    if (!result.valid) return NextResponse.json({ error: result.reason }, { status: 400 });

    await markEmailVerified(user.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}
