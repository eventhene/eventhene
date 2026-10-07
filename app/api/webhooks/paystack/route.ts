import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paystack } from "@/lib/payments/paystack";
import { issueTicketsForOrder } from "@/lib/services/tickets";
import { renderAndStoreTicketPdfs } from "@/lib/services/render";
import { sendTicketEmails } from "@/lib/services/notify";
import { grantCredits } from "@/lib/sms/credits";

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

  // Verify with Paystack as a defense-in-depth check
  const verified = await paystack.verify(reference).catch(() => null);
  if (!verified || verified.status !== "success") {
    return new NextResponse("not_verified", { status: 400 });
  }

  // SMS top-up payment
  if (reference.startsWith("sms_")) {
    const meta = event.data?.metadata;
    if (meta?.type === "sms_topup" && meta?.organizerId && meta?.credits) {
      try {
        await grantCredits({
          organizerId: meta.organizerId,
          amount: Number(meta.credits),
          kind: "PURCHASE",
          note: `Self-service top-up (${meta.credits} credits, GHS ${(verified.amount / 100).toFixed(2)})`,
          actorId: meta.userId,
        });
      } catch (e) {
        console.error("[paystack webhook] SMS credit grant failed", e);
      }
    }
    return NextResponse.json({ ok: true, type: "sms_topup" });
  }

  // Ticket order payment
  const order = await db.order.findUnique({ where: { id: reference } });
  if (!order) return new NextResponse("order_not_found", { status: 404 });
  if (order.status === "PAID") {
    return NextResponse.json({ ok: true, idempotent: true });
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
