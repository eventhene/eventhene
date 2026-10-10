import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { readSessionFromRequest } from "@/lib/auth/session";
import { hashPassword, verifyPassword, validatePasswordStrength } from "@/lib/auth/password";
import { rateLimit } from "@/lib/ratelimit";
import { passwordChangedNotice } from "@/lib/auth/security-notices";

const Body = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!(await rateLimit(user.id, 8, 900, "pw-change"))) {
      return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
    }
    const { currentPassword, newPassword } = Body.parse(await req.json());

    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      return NextResponse.json({ error: "Your current password is not correct." }, { status: 400 });
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ error: "Choose a new password that is different from the current one." }, { status: 400 });
    }
    const strength = validatePasswordStrength(newPassword);
    if (!strength.ok) return NextResponse.json({ error: strength.reason }, { status: 400 });

    await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });

    // sign out every other device, keep this one
    const current = await readSessionFromRequest(req);
    await db.session.deleteMany({ where: { userId: user.id, ...(current ? { NOT: { id: current.session.id } } : {}) } });

    passwordChangedNotice(user.email).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Please fill in both passwords." }, { status: 400 });
    console.error("[account password]", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
