import { db } from "@/lib/db";
import { requireOrganizer } from "@/lib/auth";
import { SenderIdForm } from "@/components/dashboard/SenderIdForm";
import { getPlatformSenderId } from "@/lib/sms/hubtel";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "SMS" };
export const dynamic = "force-dynamic";

export default async function SmsSettingsPage() {
  const { organizer } = await requireOrganizer();

  const transactions = await db.smsTransaction.findMany({
    where: { organizerId: organizer.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const platformSender = getPlatformSenderId();
  const effectiveSender =
    organizer.senderIdStatus === "APPROVED" && organizer.senderId
      ? organizer.senderId
      : platformSender;

  return (
    <div className="space-y-10 max-w-4xl">
      <div>
        <p className="text-sm text-ink-muted">Messaging</p>
        <h1 className="h-section mt-1">SMS</h1>
      </div>

      {/* Balance + sending identity */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="card p-6 bg-canvas text-white">
          <p className="text-[11px] uppercase tracking-widest text-white/50 mb-2">SMS balance</p>
          <p className="font-display text-5xl">{organizer.smsBalance}</p>
          <p className="text-sm text-white/60 mt-2">credits (= 1 SMS segment each)</p>
          {organizer.smsFrozen && (
            <div className="mt-4 chip-crimson w-fit">Sending frozen</div>
          )}
          <p className="mt-6 text-xs text-white/50">
            Need more? Message your EventHene account manager. We're adding self-serve top-up soon.
          </p>
        </div>

        <div className="card p-6">
          <p className="text-[11px] uppercase tracking-widest text-ink-muted mb-2">Sending as</p>
          <p className="font-display text-3xl font-mono">{effectiveSender}</p>
          <StatusChip status={organizer.senderIdStatus} />
          <p className="text-xs text-ink-muted mt-5">
            The platform default is <strong>{platformSender}</strong>. Request a custom Sender ID below. Our team approves it before it goes live.
          </p>
        </div>
      </div>

      {/* Sender ID request */}
      <section className="card p-7 space-y-5">
        <div>
          <h2 className="h-card">Custom Sender ID</h2>
          <p className="text-ink-muted text-sm mt-1">
            Your brand name on every SMS (up to 11 characters, letters and numbers only).
          </p>
        </div>
        <SenderIdForm
          currentSenderId={organizer.senderId}
          currentStatus={organizer.senderIdStatus}
          currentNote={organizer.senderIdNote}
        />
      </section>

      {/* Transaction log */}
      <section>
        <h2 className="h-card mb-4">Credit activity</h2>
        {transactions.length === 0 ? (
          <div className="card p-10 text-center text-ink-muted text-sm">No activity yet.</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Kind</th>
                  <th className="px-5 py-3">Note</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-right">Balance after</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-t border-border">
                    <td className="px-5 py-3 text-ink-muted">{formatDate(t.createdAt)}</td>
                    <td className="px-5 py-3">
                      <KindChip kind={t.kind} />
                    </td>
                    <td className="px-5 py-3 text-ink-muted truncate max-w-[280px]">{t.note ?? "-"}</td>
                    <td className={`px-5 py-3 text-right font-mono ${t.amount >= 0 ? "text-emerald" : "text-crimson"}`}>
                      {t.amount >= 0 ? "+" : ""}{t.amount}
                    </td>
                    <td className="px-5 py-3 text-right font-mono">{t.balanceAfter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  if (status === "APPROVED") return <span className="chip-emerald mt-3">Approved</span>;
  if (status === "PENDING") return <span className="chip-sky mt-3">In review</span>;
  if (status === "REJECTED") return <span className="chip-crimson mt-3">Rejected</span>;
  return <span className="chip-outline mt-3">Using platform default</span>;
}

function KindChip({ kind }: { kind: string }) {
  const map: Record<string, string> = {
    GRANT: "chip-emerald",
    PURCHASE: "chip-emerald",
    REFUND: "chip-sky",
    ADJUST: "chip-outline",
    DEDUCT: "chip-outline",
  };
  return <span className={map[kind] || "chip-outline"}>{kind.toLowerCase()}</span>;
}
