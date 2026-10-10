import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle, Mail, Ticket, Smartphone } from "lucide-react";
import { db } from "@/lib/db";
import { formatMinorAmount } from "@/lib/utils";
import { PaymentPoller } from "@/components/orders/PaymentPoller";
import { isPlaceholderEmail } from "@/lib/guest-email";

export const metadata = { title: "Confirmed" };
export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({ params }: { params: { id: string } }) {
  const order = await db.order.findUnique({
    where: { id: params.id },
    include: {
      event: true,
      tickets: { include: { attendee: true, ticketType: true } },
    },
  });
  if (!order) notFound();

  const pending = order.status === "PENDING";
  const failed = order.status === "FAILED" || order.status === "CANCELLED";

  return (
    <div className="section max-w-2xl py-16">
      {pending && <PaymentPoller orderId={order.id} />}

      {failed && (
        <div className="card-glass rounded-2xl p-12 text-center">
          <h1 className="h-section mb-3">Payment didn't go through.</h1>
          <p className="text-ink-muted">No charge was made. Try again from the event page.</p>
          <Link href={`/events/${order.event.slug}`} className="btn-primary btn-lg mt-6">Back to event</Link>
        </div>
      )}

      {order.status === "PAID" && order.tickets.length > 0 && (
        <>
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-full bg-emerald/10 flex items-center justify-center text-emerald mx-auto mb-6">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h1 className="h-section">You're all set.</h1>
            <p className="text-ink-muted mt-3">
              {order.event.type === "FREE"
                ? "You are registered. "
                : `Your ticket${order.tickets.length > 1 ? "s are" : " is"} confirmed. `}
              {isPlaceholderEmail(order.buyerEmail)
                ? "We sent the details by SMS."
                : <>Sent to <strong className="text-ink">{order.buyerEmail}</strong> and by SMS.</>}
            </p>
          </div>

          <div className="card-glass rounded-2xl p-7 mb-5">
            <h2 className="h-card mb-1">{order.event.title}</h2>
            <p className="text-sm text-ink-muted mb-5">
              {order.event.venue}
            </p>
            <div className="space-y-3">
              {order.tickets.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl bg-surface-2 p-4 gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{t.attendee.fullName}</p>
                    <p className="text-xs text-ink-muted">{t.ticketType.name}</p>
                    <p className="font-mono text-xs text-royal-2 mt-1">{t.visibleRef}</p>
                  </div>
                  <a
                    href={`/api/tickets/${t.id}/pdf?order=${order.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary btn-sm"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="card-glass rounded-2xl p-6 text-sm">
            <p className="font-semibold mb-3">What's next?</p>
            <ul className="space-y-2 text-ink-muted">
              {!isPlaceholderEmail(order.buyerEmail) && <li className="flex items-start gap-2"><Mail className="w-4 h-4 text-accent mt-0.5 shrink-0" /> Check your email for the ticket PDF (also check spam)</li>}
              <li className="flex items-start gap-2"><Ticket className="w-4 h-4 text-accent mt-0.5 shrink-0" /> Save your reference: <span className="font-mono text-ink">{order.tickets[0]?.visibleRef}</span></li>
              <li className="flex items-start gap-2"><Smartphone className="w-4 h-4 text-accent mt-0.5 shrink-0" /> Show the QR at the gate - that's your entry</li>
            </ul>
          </div>

          <p className="text-center text-xs text-ink-muted mt-6">
            Order total: {formatMinorAmount(order.totalMinor, order.currency)} ·{" "}
            <Link href="/tickets/lookup" className="underline">Find my ticket later</Link>
          </p>
        </>
      )}
    </div>
  );
}
