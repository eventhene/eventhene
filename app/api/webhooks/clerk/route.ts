import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return new NextResponse("not_configured", { status: 503 });

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSig = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSig) {
    return new NextResponse("missing_headers", { status: 400 });
  }

  const raw = await req.text();
  let evt: any;
  try {
    evt = new Webhook(secret).verify(raw, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSig
    });
  } catch {
    return new NextResponse("invalid_signature", { status: 401 });
  }

  const { type, data } = evt;
  if (type === "user.created" || type === "user.updated") {
    const email = data.email_addresses?.[0]?.email_address;
    if (!email) return NextResponse.json({ ok: true });
    await db.user.upsert({
      where: { clerkId: data.id },
      update: {
        email,
        fullName: [data.first_name, data.last_name].filter(Boolean).join(" ") || null,
        imageUrl: data.image_url
      },
      create: {
        clerkId: data.id,
        email,
        fullName: [data.first_name, data.last_name].filter(Boolean).join(" ") || null,
        imageUrl: data.image_url
      }
    });
  } else if (type === "user.deleted") {
    await db.user.deleteMany({ where: { clerkId: data.id } }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
