import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signUpUser } from "@/lib/auth";

const Body = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  country: z.string().length(2).optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().max(60).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const data = Body.parse(await req.json());
    const { user, sessionInfo } = await signUpUser(data);
    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, role: user.role } });
    res.cookies.set(sessionInfo.cookieName, sessionInfo.jwt, sessionInfo.cookieOptions);
    return res;
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Please check your info and try again." }, { status: 400 });
    }
    return NextResponse.json({ error: e.message || "Sign-up failed." }, { status: 400 });
  }
}
