import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatMinorAmount } from "@/lib/utils";

export const metadata = { title: "Ticket confirmed" };
export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({ params }: { params: { id: string } }) {
  const order = await db.order.findUnique({
    where: { id: params.id },
    include: {
      event: true,
      tickets: { include: { attendee: true, ticketType: true } }
    }
  });
  if (!order) notFound();

  const pending = order.status === "PENDING";
  const failed = order.status === "FAILED" || order.status === "CANCELLED";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {pending && (
        <div className="card p-8 text-center">
          <h1 className="h-display text-3xl mb-2">Confirming your payment…</h1>
          <p className="text-ink-muted">
            We're waiting for your bank/Mobile Money confirmation. This page will update automatically.
          </p>
          <p className="text-xs text-ink-muted mt-4">Reference: <span className="font-mono">{order.id}</span></p>
          <meta httpEquiv="refresh" content="5" />
        </div>
      )}

      {failed && (
        <div className="card p-8 text-center">
          <h1 className="h-display text-3xl mb-2">Payment didn't go through</h1>
          <p className="text-ink-muted">No charge was made. Try again from the event page.</p>
          <Link href={`/events/${order.event.id}`} className="btn-primary mt-4 inline-flex">Back to event</Link>
        </div>
      )}

      {order.status === "PAID" && order.tickets.length > 0 && (
        <>
          <div className="text-center mb-8">
            <div className="text-5xl mb-2">🎟️</div>
            <h1 className="h-display text-4xl mb-2">Long live the king.</h1>
            <p className="text-ink-muted">
              Your ticket{order.tickets.length > 1 ? "s are" : " is"} confirmed and on the way to <strong>{order.buyerEmail}</strong>.
            </p>
          </div>

          <div className="card p-6 mb-6">
            <h2 className="h-display text-xl mb-3">{order.event.title}</h2>
            <p className="text-sm text-ink-muted mb-4">
              {order.event.venue} · {order.event.country}
            </p>
            <div className="space-y-3">
              {order.tickets.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl bg-surface-2 p-4">
                  <div>
                    <p className="font-medium">{t.attendee.fullName}</p>
                    <p className="text-xs text-ink-muted">{t.ticketType.name}</p>
                    <p className="font-mono text-sm text-primary mt-1">{t.visibleRef}</p>
                  </div>
                  {t.pdfUrl ? (
                    <a href={t.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
                      Download
                    </a>
                  ) : (
                    <span className="chip-muted">PDF generating…</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 text-sm">
            <p className="font-semibold mb-2">What's next?</p>
            <ul className="space-y-1 text-ink-muted">
              <li>📧 Check your email for the ticket PDF (also check spam)</li>
              <li>🎟️ Save your ticket reference: <span className="font-mono">{order.tickets[0]?.visibleRef}</span></li>
              <li>📱 Show the QR code at the gate — that's your seat</li>
            </ul>
          </div>

          <p className="text-center text-xs text-ink-muted mt-6">
            Order total: {formatMinorAmount(order.totalMinor, order.currency)} ·
            <Link href="/tickets/lookup" className="ml-1 underline">Find my ticket later</Link>
          </p>
        </>
      )}
    </div>
  );
}
