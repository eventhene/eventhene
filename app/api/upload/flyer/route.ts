import { NextRequest, NextResponse } from "next/server";
import { requireOrganizer } from "@/lib/auth";
import { uploadFlyer } from "@/lib/storage";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  const org = await requireOrganizer(req);
  if (!org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, and WebP images are allowed" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image must be under 5 MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const url = await uploadFlyer(sanitized, buffer, file.type);

  return NextResponse.json({ url });
}
