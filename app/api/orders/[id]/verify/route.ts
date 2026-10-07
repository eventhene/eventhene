import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paystack } from "@/lib/payments/paystack";
import { fulfilOrder } from "@/lib/services/fulfil";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const order = await db.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (order.status === "PAID") {
    return NextResponse.json({ status: "PAID" });
  }

  if (order.status !== "PENDING") {
    return NextResponse.json({ status: order.status });
  }

  const verified = await paystack.verify(order.id).catch(() => null);
  if (!verified || verified.status !== "success") {
    return NextResponse.json({ status: "PENDING" });
  }

  await db.order.update({
    where: { id: order.id },
    data: { status: "PAID", paidAt: new Date(), providerRef: String(verified.id) },
  });

  await fulfilOrder(order.id, "verify");

  return NextResponse.json({ status: "PAID" });
}
