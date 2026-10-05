import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireEventOwner } from "@/lib/auth";
import { formatMinorAmount, formatDate } from "@/lib/utils";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { CopyLinkButton } from "@/components/dashboard/CopyLinkButton";

export const dynamic = "force-dynamic";

export default async function EventOverviewPage({ params }: { params: { id: string } }) {
  await requireEventOwner(params.id);
  const event = await db.event.findUnique({
    where: { id: params.id },
    include: {
      ticketTypes: { orderBy: { sortOrder: "asc" } },
      tickets: { select: { status: true } },
      _count: { select: { tickets: true, attendees: true, smsCampaigns: true } },
    },
  });
  if (!event) notFound();

  const sold = event.ticketTypes.reduce((s, t) => s + t.sold, 0);
  const revenue = event.ticketTypes.reduce((s, t) => s + t.sold * t.priceMinor, 0);
  const total = event.ticketTypes.reduce((s, t) => s + t.quantity, 0);
  const attended = event.tickets.filter((t) => t.status === "ATTENDED").length;
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/events/${event.slug}`;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <p className="text-xs text-ink-muted uppercase tracking-widest">{event.category}</p>
          <h1 className="h-section mt-2">{event.title}</h1>
          <p className="text-ink-muted mt-1">{formatDate(event.startsAt, event.timezone)} · {event.venue}</p>
          <div className="mt-3"><StatusChip status={event.status} /></div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap gap-2">
        <Link href={`/events/${event.slug}`} target="_blank" className="btn-ghost btn-md">View public page ↗</Link>
        <Link href={`/dashboard/events/${event.id}/attendees`} className="btn-ghost btn-md">Attendees</Link>
        <Link href={`/dashboard/events/${event.id}/sms`} className="btn-ghost btn-md">Bulk SMS</Link>
        <Link href={`/scan/${event.id}`} className="btn-primary btn-md">Open scanner</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Sold" value={`${sold} / ${total}`} />
        <Kpi label="Revenue" value={formatMinorAmount(revenue, event.currency)} />
        <Kpi label="Attended" value={attended.toString()} />
        <Kpi label="SMS campaigns" value={event._count.smsCampaigns.toString()} />
      </div>

      <div className="grid lg:grid-cols-[1.3fr,1fr] gap-6">
        <div className="card p-6">
          <h2 className="h-card mb-4">Ticket types</h2>
          <div className="space-y-2">
            {event.ticketTypes.map((t) => {
              const pct = t.quantity ? Math.min(100, Math.round((t.sold / t.quantity) * 100)) : 0;
              return (
                <div key={t.id} className="rounded-xl bg-surface-2 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t.name}</p>
                      {t.notes && <p className="text-xs text-ink-muted">{t.notes}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {event.type === "FREE" ? "Free" : formatMinorAmount(t.priceMinor, event.currency)}
                      </p>
                      <p className="text-xs text-ink-muted font-mono">{t.sold} / {t.quantity}</p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-border overflow-hidden">
                    <div className="h-full bg-royal-2" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="h-card mb-3">Share</h2>
            <div className="rounded-lg bg-surface-2 p-3 font-mono text-xs break-all mb-3">{publicUrl}</div>
            <CopyLinkButton url={publicUrl} />
          </div>
          <div className="card p-6 bg-canvas text-white">
            <h2 className="h-card text-white mb-2">Send bulk SMS</h2>
            <p className="text-white/60 text-sm mb-4">
              Blast a reminder, update, or thank-you to everyone who registered.
            </p>
            <Link href={`/dashboard/events/${event.id}/sms`} className="btn-gold btn-md">
              Open SMS composer
            </Link>
          </div>
        </div>
      </div>
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
