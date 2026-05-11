import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";

const Body = z.object({
  email: z.string().email(),
  subject: z.string().min(2).max(200),
  body: z.string().min(5).max(5000)
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const ok = await rateLimit(`support:${ip}`, 5, 60, "support");
  if (!ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const data = Body.parse(await req.json());
  const user = await getCurrentUser();
  const t = await db.supportTicket.create({
    data: { ...data, userId: user?.id }
  });
  return NextResponse.json({ id: t.id }, { status: 201 });
}
