import Link from "next/link";
import { db } from "@/lib/db";
import { requireOrganizer } from "@/lib/auth";
import { formatMinorAmount, formatDateShort } from "@/lib/utils";
import { StatusChip } from "@/components/dashboard/StatusChip";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const { organizer, user } = await requireOrganizer();

  const events = await db.event.findMany({
    where: { organizerId: organizer.id },
    include: { ticketTypes: true, tickets: { select: { status: true } } },
    orderBy: { createdAt: "desc" },
  });

  let totalSold = 0;
  let totalRevenue = 0;
  let totalAttended = 0;
  let remaining = 0;
  let currency = user.currency || "GHS";
  for (const e of events) {
    currency = e.currency;
    for (const tt of e.ticketTypes) {
      totalSold += tt.sold;
      totalRevenue += tt.sold * tt.priceMinor;
      remaining += Math.max(0, tt.quantity - tt.sold);
    }
    totalAttended += e.tickets.filter((t) => t.status === "ATTENDED").length;
  }

  const firstName = user.fullName?.split(" ")[0] || organizer.displayName.split(" ")[0];

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-ink-muted font-semibold">Welcome back</p>
          <h1 className="h-section mt-1">{firstName}.</h1>
        </div>
        <Link href="/dashboard/events/new" className="btn-primary btn-lg">New event</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Tickets sold" value={totalSold.toString()} />
        <Kpi label="Revenue" value={formatMinorAmount(totalRevenue, currency)} accent />
        <Kpi label="Attended" value={totalAttended.toString()} />
        <Kpi label="Remaining" value={remaining.toString()} />
      </div>

      <section>
        <div className="flex items-end justify-between mb-5">
          <h2 className="h-card">Your events</h2>
          <Link href="/dashboard/events" className="text-sm text-ink-muted hover:text-ink font-semibold">
            View all
          </Link>
        </div>
        {events.length === 0 ? (
          <div className="card p-16 text-center">
            <h3 className="h-card mb-2">No events yet.</h3>
            <p className="text-ink-muted mb-6">Create your first event in under 5 minutes.</p>
            <Link href="/dashboard/events/new" className="btn-primary btn-lg">Create event</Link>
          </div>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
            {events.slice(0, 6).map((e) => {
              const sold = e.ticketTypes.reduce((s, t) => s + t.sold, 0);
              const total = e.ticketTypes.reduce((s, t) => s + t.quantity, 0);
              return (
                <Link
                  key={e.id}
                  href={`/dashboard/events/${e.id}`}
                  className="card p-4 sm:p-5 min-w-0 flex items-center gap-3 sm:gap-4 hover:border-ink/20 transition group"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-surface-2 shrink-0 overflow-hidden">
                    {e.flyerUrl && (
                      <img src={e.flyerUrl} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base sm:text-lg truncate group-hover:text-accent transition">{e.title}</p>
                    <p className="text-xs text-ink-muted mt-0.5 font-medium truncate">
                      {formatDateShort(e.startsAt, e.timezone)} - {e.venue}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusChip status={e.status} />
                    <p className="text-xs text-ink-muted mt-1 font-mono font-semibold">{sold} / {total}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 ${accent ? "bg-accent/10" : "bg-surface-2"}`}>
      <p className="text-[11px] uppercase tracking-widest font-semibold text-ink-muted mb-2">{label}</p>
      <p className={`font-extrabold text-3xl tracking-tight ${accent ? "text-accent" : "text-ink"}`}>{value}</p>
    </div>
  );
}
