import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireEventOwner } from "@/lib/auth";
import { formatMinorAmount, formatDate } from "@/lib/utils";

export default async function EventOverviewPage({ params }: { params: { id: string } }) {
  await requireEventOwner(params.id);
  const event = await db.event.findUnique({
    where: { id: params.id },
    include: {
      ticketTypes: { orderBy: { sortOrder: "asc" } },
      tickets: { select: { status: true } },
      _count: { select: { tickets: true, attendees: true } }
    }
  });
  if (!event) notFound();

  const sold = event.ticketTypes.reduce((s, t) => s + t.sold, 0);
  const revenue = event.ticketTypes.reduce((s, t) => s + t.sold * t.priceMinor, 0);
  const total = event.ticketTypes.reduce((s, t) => s + t.quantity, 0);
  const attended = event.tickets.filter((t) => t.status === "ATTENDED").length;
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/events/${event.slug}`;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-ink-muted">{event.category} · {formatDate(event.startsAt, event.timezone)}</p>
          <h1 className="h-display text-3xl">{event.title}</h1>
          <p className="text-sm text-ink-muted">{event.venue}</p>
        </div>
        <span className="chip-muted">{event.status.replace("_", " ")}</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link href={`/events/${event.slug}`} target="_blank" className="btn-secondary text-sm">View public page ↗</Link>
        <Link href={`/dashboard/events/${event.id}/attendees`} className="btn-secondary text-sm">Attendees</Link>
        <Link href={`/scan/${event.id}`} className="btn-primary text-sm">Open scanner</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Kpi label="Sold" value={`${sold} / ${total}`} />
        <Kpi label="Revenue" value={formatMinorAmount(revenue, event.currency)} />
        <Kpi label="Attended" value={attended.toString()} />
        <Kpi label="Tickets" value={event._count.tickets.toString()} />
      </div>

      <div className="card p-6 mb-6">
        <h2 className="h-display text-xl mb-3">Ticket types</h2>
        <div className="space-y-2">
          {event.ticketTypes.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
              <div>
                <p className="font-medium">{t.name}</p>
                {t.notes && <p className="text-xs text-ink-muted">{t.notes}</p>}
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {event.type === "FREE" ? "Free" : formatMinorAmount(t.priceMinor, event.currency)}
                </p>
                <p className="text-xs text-ink-muted">{t.sold} / {t.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="h-display text-xl mb-3">Share your event</h2>
        <div className="rounded-xl bg-surface-2 p-3 font-mono text-sm break-all">{publicUrl}</div>
        <p className="text-xs text-ink-muted mt-2">Share this link anywhere — WhatsApp, IG, Twitter, email.</p>
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
