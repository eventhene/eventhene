import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { verifyPassword } from "@/lib/auth/password";
import { createAndSendOtp } from "@/lib/auth/otp";
import { rateLimit } from "@/lib/ratelimit";

const Body = z.object({ newEmail: z.string().email(), password: z.string().min(1).max(200) });

/** Step 1: prove it is you (current password), then send a code to the NEW address. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!(await rateLimit(user.id, 6, 900, "email-change"))) {
      return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
    }
    const body = Body.parse(await req.json());
    const newEmail = body.newEmail.trim().toLowerCase();

    if (!(await verifyPassword(body.password, user.passwordHash))) {
      return NextResponse.json({ error: "Your password is not correct." }, { status: 400 });
    }
    if (newEmail === user.email.toLowerCase()) {
      return NextResponse.json({ error: "That is already your email address." }, { status: 400 });
    }
    if (await db.user.findUnique({ where: { email: newEmail }, select: { id: true } })) {
      return NextResponse.json({ error: "That email address is already used by another account." }, { status: 409 });
    }

    await createAndSendOtp(user.id, "email", newEmail, `emailchange:${newEmail}`);
    const [name, domain] = newEmail.split("@");
    return NextResponse.json({ ok: true, sentTo: `${name.slice(0, 2)}***@${domain}` });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Enter a valid email address and your password." }, { status: 400 });
    return NextResponse.json({ error: e?.message || "Could not send the code." }, { status: 500 });
  }
}
