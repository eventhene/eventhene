import { db } from "@/lib/db";
import { SenderIdRow } from "@/components/admin/SenderIdRow";
import { CreditGrantForm } from "@/components/admin/CreditGrantForm";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Admin SMS" };
export const dynamic = "force-dynamic";

export default async function AdminSmsPage() {
  const organizers = await db.organizer.findMany({
    where: {},
    include: { user: { select: { email: true, fullName: true } } },
    orderBy: [{ senderIdStatus: "asc" }, { updatedAt: "desc" }],
    take: 500,
  });

  const pending = organizers.filter((o) => o.senderIdStatus === "PENDING");
  const otherStatuses = organizers.filter((o) => o.senderIdStatus !== "PENDING");

  const recentCampaigns = await db.smsCampaign.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { organizer: { select: { displayName: true } } },
  });

  const totalSent = await db.smsCampaign.aggregate({
    _sum: { totalSent: true, totalFailed: true, creditsCharged: true },
  });

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm text-ink-muted">Admin</p>
        <h1 className="h-section mt-1">SMS</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Pending Sender IDs" value={pending.length.toString()} />
        <Kpi label="Sent (lifetime)" value={(totalSent._sum.totalSent ?? 0).toString()} />
        <Kpi label="Failed" value={(totalSent._sum.totalFailed ?? 0).toString()} />
        <Kpi label="Credits used" value={(totalSent._sum.creditsCharged ?? 0).toString()} />
      </div>

      {/* Pending queue */}
      <section>
        <h2 className="h-card mb-4">Sender ID approvals</h2>
        {pending.length === 0 ? (
          <div className="card p-10 text-center text-ink-muted text-sm">No requests waiting.</div>
        ) : (
          <div className="space-y-3">
            {pending.map((o) => <SenderIdRow key={o.id} organizer={o as any} />)}
          </div>
        )}
      </section>

      {/* Credit grants */}
      <section>
        <h2 className="h-card mb-4">Grant SMS credits</h2>
        <CreditGrantForm
          organizers={organizers.map((o) => ({
            id: o.id,
            name: o.displayName,
            balance: o.smsBalance,
            email: o.user.email,
            frozen: o.smsFrozen,
          }))}
        />
      </section>

      {/* History */}
      <section>
        <h2 className="h-card mb-4">All Sender IDs</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left">
              <tr>
                <th className="px-5 py-3">Organizer</th>
                <th className="px-5 py-3">Sender ID</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {otherStatuses.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-5 py-3">
                    <p className="font-medium">{o.displayName}</p>
                    <p className="text-xs text-ink-muted">{o.user.email}</p>
                  </td>
                  <td className="px-5 py-3 font-mono">{o.senderId ?? "-"}</td>
                  <td className="px-5 py-3"><StatusChip status={o.senderIdStatus} /></td>
                  <td className="px-5 py-3 text-right font-mono">{o.smsBalance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="h-card mb-4">Recent campaigns</h2>
        {recentCampaigns.length === 0 ? (
          <p className="text-sm text-ink-muted">None yet.</p>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Organizer</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Sender</th>
                  <th className="px-5 py-3 text-right">Sent/Failed</th>
                </tr>
              </thead>
              <tbody>
                {recentCampaigns.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-5 py-3 text-ink-muted">{formatDate(c.createdAt)}</td>
                    <td className="px-5 py-3">{c.organizer.displayName}</td>
                    <td className="px-5 py-3 truncate max-w-[220px]">{c.name}</td>
                    <td className="px-5 py-3 font-mono text-xs">{c.senderId}</td>
                    <td className="px-5 py-3 text-right font-mono text-xs">{c.totalSent}/{c.totalFailed}</td>
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

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-[11px] uppercase tracking-widest text-ink-muted">{label}</p>
      <p className="font-display text-3xl mt-2">{value}</p>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  if (status === "APPROVED") return <span className="chip-emerald">Approved</span>;
  if (status === "PENDING") return <span className="chip-sky">Pending</span>;
  if (status === "REJECTED") return <span className="chip-crimson">Rejected</span>;
  return <span className="chip-outline">Default</span>;
}
