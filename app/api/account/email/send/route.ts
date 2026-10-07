import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createAndSendOtp } from "@/lib/auth/otp";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const ok = await rateLimit(user.id, 5, 600, "email-verify");
    if (!ok) return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });

    await createAndSendOtp(user.id, "email", user.email);
    const [name, domain] = user.email.split("@");
    return NextResponse.json({ ok: true, sentTo: `${name.slice(0, 2)}***@${domain}` });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    return NextResponse.json({ error: e?.message || "Could not send the code." }, { status: 500 });
  }
}
