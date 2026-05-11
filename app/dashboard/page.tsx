import Link from "next/link";
import { db } from "@/lib/db";
import { requireOrganizer } from "@/lib/auth";
import { formatMinorAmount, formatDateShort } from "@/lib/utils";

export default async function DashboardHome() {
  const { organizer } = await requireOrganizer();

  const events = await db.event.findMany({
    where: { organizerId: organizer.id },
    include: { ticketTypes: true, tickets: { select: { status: true } } },
    orderBy: { createdAt: "desc" }
  });

  // KPIs
  let totalSold = 0;
  let totalRevenue = 0;
  let totalAttended = 0;
  let remaining = 0;
  let primaryCurrency = "GHS";
  for (const e of events) {
    primaryCurrency = e.currency;
    for (const tt of e.ticketTypes) {
      totalSold += tt.sold;
      totalRevenue += tt.sold * tt.priceMinor;
      remaining += Math.max(0, tt.quantity - tt.sold);
    }
    totalAttended += e.tickets.filter((t) => t.status === "ATTENDED").length;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="h-display text-3xl">Hello, {organizer.displayName} ♛</h1>
          <p className="text-ink-muted text-sm">Here's how your events are doing.</p>
        </div>
        <Link href="/dashboard/events/new" className="btn-primary">+ Create event</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Kpi label="Tickets sold" value={totalSold.toString()} />
        <Kpi label="Revenue" value={formatMinorAmount(totalRevenue, primaryCurrency)} />
        <Kpi label="Attended" value={totalAttended.toString()} />
        <Kpi label="Remaining" value={remaining.toString()} />
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="h-display text-xl">Your events</h2>
          <Link href="/dashboard/events" className="text-sm text-primary hover:underline">View all →</Link>
        </div>
        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-ink-muted mb-4">You haven't created an event yet.</p>
            <Link href="/dashboard/events/new" className="btn-primary">Create your first event</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 5).map((e) => {
              const sold = e.ticketTypes.reduce((s, t) => s + t.sold, 0);
              const total = e.ticketTypes.reduce((s, t) => s + t.quantity, 0);
              return (
                <Link key={e.id} href={`/dashboard/events/${e.id}`} className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-surface-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{e.title}</p>
                    <p className="text-xs text-ink-muted">{formatDateShort(e.startsAt, e.timezone)} · {e.venue}</p>
                  </div>
                  <div className="text-right ml-3">
                    <StatusChip status={e.status} />
                    <p className="text-xs text-ink-muted mt-1">{sold} / {total} sold</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="font-display text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: "chip-muted",
    PENDING_APPROVAL: "chip-warning",
    EDITS_REQUESTED: "chip-warning",
    PUBLISHED: "chip-success",
    REJECTED: "chip-danger",
    PAUSED: "chip-muted",
    ENDED: "chip-muted",
    CANCELLED: "chip-danger"
  };
  return <span className={map[status] ?? "chip-muted"}>{status.replace("_", " ")}</span>;
}
