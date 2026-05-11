import Link from "next/link";
import { db } from "@/lib/db";
import { formatMinorAmount, formatDateShort } from "@/lib/utils";

export const metadata = { title: "Browse Events" };

const CATEGORIES = ["All", "Music", "Faith", "Conference", "Sports", "Comedy", "Other"];

export default async function EventsListPage({
  searchParams
}: {
  searchParams: { category?: string; q?: string };
}) {
  const where: any = { status: "PUBLISHED", endsAt: { gt: new Date() } };
  if (searchParams.category && searchParams.category !== "All") {
    where.category = searchParams.category;
  }
  if (searchParams.q) {
    where.title = { contains: searchParams.q, mode: "insensitive" };
  }
  const events = await db.event
    .findMany({
      where,
      orderBy: { startsAt: "asc" },
      take: 60,
      include: { ticketTypes: { where: { isActive: true } } }
    })
    .catch(() => []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="h-display text-4xl mb-2">Browse events</h1>
      <p className="text-ink-muted mb-8">All published events on EventHene.</p>

      <form className="mb-6 flex gap-2 flex-wrap">
        <input
          type="search"
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search events…"
          className="input max-w-sm"
        />
        <select name="category" defaultValue={searchParams.category ?? "All"} className="input max-w-xs">
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button type="submit" className="btn-primary">Search</button>
      </form>

      {events.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-ink-muted">No events match your search yet.</p>
          <Link href="/dashboard/events/new" className="btn-primary mt-4 inline-flex">
            Be the first — create an event
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {events.map((e) => {
            const min = Math.min(...e.ticketTypes.map((t) => t.priceMinor));
            return (
              <Link key={e.id} href={`/events/${e.slug}`} className="card overflow-hidden group">
                <div className="aspect-[4/5] bg-surface-2 overflow-hidden">
                  {e.flyerUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={e.flyerUrl}
                      alt={e.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs text-accent uppercase tracking-wider mb-1">
                    {formatDateShort(e.startsAt, e.timezone)}
                  </p>
                  <h3 className="font-display text-xl line-clamp-1">{e.title}</h3>
                  <p className="text-sm text-ink-muted line-clamp-1 mt-1">{e.venue}</p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-sm font-semibold">
                      {e.type === "FREE" ? "Free" : `From ${formatMinorAmount(min, e.currency)}`}
                    </p>
                    <span className="chip-muted">{e.category}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
