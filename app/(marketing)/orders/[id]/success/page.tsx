import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatMinorAmount } from "@/lib/utils";

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
      {pending && (
        <div className="card p-12 text-center">
          <div className="spinner inline-block text-royal-2" />
          <h1 className="h-section mt-6 mb-2">Confirming payment...</h1>
          <p className="text-ink-muted">We're waiting for your bank or Mobile Money confirmation. This page refreshes automatically.</p>
          <p className="text-xs text-ink-muted mt-6 font-mono">Reference: {order.id}</p>
          <meta httpEquiv="refresh" content="5" />
        </div>
      )}

      {failed && (
        <div className="card p-12 text-center">
          <h1 className="h-section mb-3">Payment didn't go through.</h1>
          <p className="text-ink-muted">No charge was made. Try again from the event page.</p>
          <Link href={`/events/${order.event.id}`} className="btn-primary btn-lg mt-6">Back to event</Link>
        </div>
      )}

      {order.status === "PAID" && order.tickets.length > 0 && (
        <>
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-full bg-emerald/10 flex items-center justify-center text-emerald text-3xl mx-auto mb-6">
              ♛
            </div>
            <h1 className="h-section">Long live the king.</h1>
            <p className="text-ink-muted mt-3">
              Your ticket{order.tickets.length > 1 ? "s are" : " is"} confirmed and sent to <strong className="text-ink">{order.buyerEmail}</strong>.
            </p>
          </div>

          <div className="card p-7 mb-5">
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
                  {t.pdfUrl ? (
                    <a href={t.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm">
                      Download
                    </a>
                  ) : (
                    <span className="chip-outline">PDF generating...</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 text-sm">
            <p className="font-semibold mb-3">What's next?</p>
            <ul className="space-y-2 text-ink-muted">
              <li>📧 Check your email for the ticket PDF (also check spam)</li>
              <li>🎟️ Save your reference: <span className="font-mono text-ink">{order.tickets[0]?.visibleRef}</span></li>
              <li>📱 Show the QR at the gate - that's your seat</li>
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
