import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { verifyOtp } from "@/lib/auth/otp";
import { rateLimit } from "@/lib/ratelimit";
import { emailChangedNotice } from "@/lib/auth/security-notices";

const Body = z.object({ newEmail: z.string().email(), code: z.string().min(4).max(8) });

/** Step 2: the code sent to the new address proves they own it; then the email is switched. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!(await rateLimit(user.id, 12, 900, "email-change-confirm"))) {
      return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
    }
    const body = Body.parse(await req.json());
    const newEmail = body.newEmail.trim().toLowerCase();

    const result = await verifyOtp(user.id, "email", body.code, `emailchange:${newEmail}`);
    if (!result.valid) return NextResponse.json({ error: result.reason || "That code is not right." }, { status: 400 });

    if (await db.user.findFirst({ where: { email: newEmail, NOT: { id: user.id } }, select: { id: true } })) {
      return NextResponse.json({ error: "That email address is already used by another account." }, { status: 409 });
    }
    const oldEmail = user.email;
    await db.user.update({ where: { id: user.id }, data: { email: newEmail, emailVerified: true } });
    emailChangedNotice(oldEmail, newEmail).catch(() => {});
    return NextResponse.json({ ok: true, email: newEmail });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
    console.error("[email change confirm]", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
