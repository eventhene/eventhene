import Link from "next/link";
import { db } from "@/lib/db";
import { requireOrganizer } from "@/lib/auth";
import { SenderIdForm } from "@/components/dashboard/SenderIdForm";
import { SmsTopUp } from "@/components/dashboard/SmsTopUp";
import { getPlatformSenderId } from "@/lib/sms/hubtel";
import { formatDate } from "@/lib/utils";
import { MessageSquare, Send, CreditCard } from "lucide-react";

export const metadata = { title: "SMS" };
export const dynamic = "force-dynamic";

export default async function SmsSettingsPage() {
  const { organizer } = await requireOrganizer();

  const transactions = await db.smsTransaction.findMany({
    where: { organizerId: organizer.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const campaignCount = await db.smsCampaign.count({
    where: { organizerId: organizer.id },
  });

  const platformSender = getPlatformSenderId();
  const effectiveSender =
    organizer.senderIdStatus === "APPROVED" && organizer.senderId
      ? organizer.senderId
      : platformSender;

  return (
    <div className="space-y-10 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-white/40">Messaging</p>
          <h1 className="h-section mt-1 text-white">SMS</h1>
        </div>
        <Link href="/dashboard/sms/compose" className="btn-gold btn-md flex items-center gap-2">
          <Send className="w-4 h-4" />
          Compose SMS
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="card-glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-accent" />
            <p className="text-[11px] uppercase tracking-widest text-white/50">SMS balance</p>
          </div>
          <p className="font-display text-5xl text-white">{organizer.smsBalance}</p>
          <p className="text-sm text-white/60 mt-2">credits (1 credit = 1 SMS segment)</p>
          {organizer.smsFrozen && (
            <div className="mt-4 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 w-fit">Sending frozen</div>
          )}
          <p className="text-xs text-white/30 mt-4">{campaignCount} campaign{campaignCount !== 1 ? "s" : ""} sent</p>
        </div>

        <div className="card-glass rounded-2xl p-6">
          <p className="text-[11px] uppercase tracking-widest text-white/50 mb-3">Sending as</p>
          <p className="font-display text-3xl font-mono text-white">{effectiveSender}</p>
          <StatusChip status={organizer.senderIdStatus} />
          <p className="text-xs text-white/40 mt-5">
            Default: <strong className="text-white/60">{platformSender}</strong>. Request a custom one below.
          </p>
        </div>
      </div>

      {/* SMS Top-Up */}
      <section className="card-glass rounded-2xl p-7 space-y-5">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Buy SMS credits</h2>
        </div>
        <SmsTopUp />
      </section>

      {/* Sender ID request */}
      <section className="card-glass rounded-2xl p-7 space-y-5">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Custom Sender ID</h2>
          <p className="text-white/40 text-sm mt-1">
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
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Credit activity</h2>
        {transactions.length === 0 ? (
          <div className="card-glass rounded-2xl p-10 text-center text-white/40 text-sm">No activity yet.</div>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => (
              <div key={t.id} className="card-glass rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <KindChip kind={t.kind} />
                    <span className="text-xs text-white/30">{formatDate(t.createdAt)}</span>
                  </div>
                  <p className="text-sm text-white/50 truncate mt-1">{t.note ?? "-"}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-mono font-bold ${t.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {t.amount >= 0 ? "+" : ""}{t.amount}
                  </p>
                  <p className="text-[10px] text-white/30 font-mono">bal: {t.balanceAfter}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  if (status === "APPROVED") return <span className="mt-3 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400">Approved</span>;
  if (status === "PENDING") return <span className="mt-3 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky-500/20 text-sky-400">In review</span>;
  if (status === "REJECTED") return <span className="mt-3 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-500/20 text-red-400">Rejected</span>;
  return <span className="mt-3 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/10 text-white/40">Using default</span>;
}

function KindChip({ kind }: { kind: string }) {
  const styles: Record<string, string> = {
    GRANT: "bg-emerald-500/20 text-emerald-400",
    PURCHASE: "bg-accent/20 text-accent",
    REFUND: "bg-sky-500/20 text-sky-400",
    ADJUST: "bg-white/10 text-white/50",
    DEDUCT: "bg-white/10 text-white/50",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${styles[kind] || styles.ADJUST}`}>{kind.toLowerCase()}</span>;
}
