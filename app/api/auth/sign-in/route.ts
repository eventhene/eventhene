import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signInUser } from "@/lib/auth";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  try {
    const data = Body.parse(await req.json());
    const { user, sessionInfo } = await signInUser(data);
    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, role: user.role } });
    res.cookies.set(sessionInfo.cookieName, sessionInfo.jwt, sessionInfo.cookieOptions);
    return res;
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Please enter a valid email and password." }, { status: 400 });
    }
    return NextResponse.json({ error: e.message || "Sign-in failed." }, { status: 400 });
  }
}
