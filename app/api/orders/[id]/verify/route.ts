import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paystack } from "@/lib/payments/paystack";
import { issueTicketsForOrder } from "@/lib/services/tickets";
import { renderAndStoreTicketPdfs } from "@/lib/services/render";
import { sendTicketEmails } from "@/lib/services/notify";

export const dynamic = "force-dynamic";

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

  const tickets = await issueTicketsForOrder(order.id);
  await renderAndStoreTicketPdfs(tickets.map((t) => t.ticketId)).catch((e) =>
    console.error("[verify] PDF render failed", e)
  );
  await sendTicketEmails(order.id).catch((e) =>
    console.error("[verify] email failed", e)
  );

  return NextResponse.json({ status: "PAID" });
}
