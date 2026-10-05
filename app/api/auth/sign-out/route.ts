import { NextResponse } from "next/server";
import { signOutUser } from "@/lib/auth";

export async function POST() {
  await signOutUser();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  await signOutUser();
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}
