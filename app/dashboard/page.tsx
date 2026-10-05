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
          <p className="text-sm text-ink-muted">Welcome back</p>
          <h1 className="h-section mt-1">{firstName}.</h1>
        </div>
        <Link href="/dashboard/events/new" className="btn-primary btn-lg">New event</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Tickets sold" value={totalSold.toString()} tint="ink" />
        <Kpi label="Revenue" value={formatMinorAmount(totalRevenue, currency)} tint="royal" />
        <Kpi label="Attended" value={totalAttended.toString()} tint="emerald" />
        <Kpi label="Remaining" value={remaining.toString()} tint="ink" />
      </div>

      <section>
        <div className="flex items-end justify-between mb-5">
          <h2 className="h-card">Your events</h2>
          <Link href="/dashboard/events" className="text-sm text-ink-muted hover:text-ink">
            View all →
          </Link>
        </div>
        {events.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="text-5xl mb-4">🎟️</div>
            <h3 className="h-card mb-2">No events yet.</h3>
            <p className="text-ink-muted mb-6">Create your first event in under 5 minutes.</p>
            <Link href="/dashboard/events/new" className="btn-primary btn-lg">Create event</Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {events.slice(0, 6).map((e) => {
              const sold = e.ticketTypes.reduce((s, t) => s + t.sold, 0);
              const total = e.ticketTypes.reduce((s, t) => s + t.quantity, 0);
              return (
                <Link
                  key={e.id}
                  href={`/dashboard/events/${e.id}`}
                  className="card p-5 flex items-center gap-4 hover:border-ink/20 transition group"
                >
                  <div className="w-16 h-16 rounded-lg bg-aurora shrink-0 overflow-hidden">
                    {e.flyerUrl && (
                      <img src={e.flyerUrl} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-xl truncate group-hover:text-royal-2 transition">{e.title}</p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {formatDateShort(e.startsAt, e.timezone)} · {e.venue}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusChip status={e.status} />
                    <p className="text-xs text-ink-muted mt-1 font-mono">{sold} / {total}</p>
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

function Kpi({ label, value, tint }: { label: string; value: string; tint?: "ink" | "royal" | "emerald" }) {
  const tints: Record<string, string> = {
    ink: "bg-canvas text-white",
    royal: "bg-royal text-white",
    emerald: "bg-emerald/10 text-emerald",
  };
  return (
    <div className={`rounded-2xl p-5 ${tints[tint || "ink"]}`}>
      <p className="text-[11px] uppercase tracking-widest opacity-70 mb-2">{label}</p>
      <p className="font-display text-3xl">{value}</p>
    </div>
  );
}
