import { NextResponse } from "next/server";
import { paystack } from "@/lib/payments/paystack";

let cached: { banks: Array<{ name: string; code: string }>; at: number } | null = null;

export async function GET() {
  try {
    if (cached && Date.now() - cached.at < 3600_000) {
      return NextResponse.json({ banks: cached.banks });
    }
    const banks = await paystack.listBanks("ghana");
    cached = { banks, at: Date.now() };
    return NextResponse.json({ banks });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
