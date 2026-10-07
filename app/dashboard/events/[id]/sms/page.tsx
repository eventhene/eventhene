import { db } from "@/lib/db";
import { requireEventOwner } from "@/lib/auth";
import { SmsComposer } from "@/components/dashboard/SmsComposer";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Bulk SMS" };
export const dynamic = "force-dynamic";

export default async function SmsPage({ params }: { params: { id: string } }) {
  const { event } = await requireEventOwner(params.id);

  const campaigns = await db.smsCampaign.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const ticketTypes = await db.ticketType.findMany({ where: { eventId: event.id } });

  const totals = await db.ticket.groupBy({
    by: ["status"],
    where: { eventId: event.id },
    _count: true,
  });
  const totalByStatus = Object.fromEntries(totals.map((t) => [t.status, t._count]));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <p className="text-xs text-ink-muted uppercase tracking-widest mb-2">Bulk SMS</p>
        <h1 className="h-section">Send to your crowd.</h1>
        <p className="text-ink-muted mt-2">
          Blast an announcement, reminder, or custom message to everyone who registered for <strong>{event.title}</strong>.
        </p>
      </div>

      <SmsComposer
        eventId={event.id}
        eventTitle={event.title}
        ticketTypes={ticketTypes.map((t) => ({ id: t.id, name: t.name }))}
        totals={{
          all: Object.values(totalByStatus).reduce((s: number, n: any) => s + n, 0),
          attended: totalByStatus["ATTENDED"] || 0,
        }}
      />

      <div>
        <h2 className="h-card mb-4">Recent campaigns</h2>
        {campaigns.length === 0 ? (
          <div className="card p-10 text-center text-ink-muted">No SMS sent yet.</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Audience</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Sent / Failed</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-ink-muted">{labelAudience(c.audience)}</td>
                    <td className="px-4 py-3">
                      <SmsStatusChip status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {c.totalSent} / {c.totalFailed}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function labelAudience(a: string) {
  if (a === "ALL") return "All attendees";
  if (a === "ATTENDED") return "Attended";
  if (a === "NOT_ATTENDED") return "Not attended yet";
  if (a.startsWith("TICKET_TYPE:")) return "Ticket type";
  return a;
}

function SmsStatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    QUEUED: "chip-outline",
    SENDING: "chip-sky",
    SENT: "chip-emerald",
    PARTIAL: "chip-outline",
    FAILED: "chip-crimson",
  };
  return <span className={map[status] || "chip-outline"}>{status.toLowerCase()}</span>;
}
