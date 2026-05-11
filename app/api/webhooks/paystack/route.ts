import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paystack } from "@/lib/payments/paystack";
import { issueTicketsForOrder } from "@/lib/services/tickets";
import { renderAndStoreTicketPdfs } from "@/lib/services/render";
import { sendTicketEmails } from "@/lib/services/notify";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!paystack.verifyWebhookSignature(raw, signature)) {
    return new NextResponse("invalid_signature", { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return new NextResponse("invalid_body", { status: 400 });
  }

  if (event.event !== "charge.success") {
    return NextResponse.json({ ok: true, ignored: event.event });
  }

  const reference: string = event.data?.reference;
  if (!reference) return new NextResponse("no_reference", { status: 400 });

  const order = await db.order.findUnique({ where: { id: reference } });
  if (!order) return new NextResponse("order_not_found", { status: 404 });
  if (order.status === "PAID") {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  // Verify with Paystack as a defense-in-depth check
  const verified = await paystack.verify(reference).catch(() => null);
  if (!verified || verified.status !== "success") {
    return new NextResponse("not_verified", { status: 400 });
  }

  await db.order.update({
    where: { id: order.id },
    data: {
      status: "PAID",
      paidAt: new Date(),
      providerRef: String(verified.id)
    }
  });

  // Issue tickets, render PDFs, send emails
  const tickets = await issueTicketsForOrder(order.id);
  await renderAndStoreTicketPdfs(tickets.map((t) => t.ticketId)).catch((e) =>
    console.error("[paystack webhook] PDF render failed", e)
  );
  await sendTicketEmails(order.id).catch((e) =>
    console.error("[paystack webhook] email failed", e)
  );

  return NextResponse.json({ ok: true });
}
