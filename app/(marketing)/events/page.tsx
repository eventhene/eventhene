import Link from "next/link";
import { db } from "@/lib/db";
import { formatMinorAmount, formatDateShort } from "@/lib/utils";

export const metadata = { title: "Discover events" };
export const dynamic = "force-dynamic";

const CATEGORIES = ["All", "Music", "Faith", "Conference", "Sports", "Comedy", "Wedding", "Party", "Other"];

export default async function EventsListPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  const where: any = { status: "PUBLISHED", endsAt: { gt: new Date() } };
  if (searchParams.category && searchParams.category !== "All") where.category = searchParams.category;
  if (searchParams.q) where.title = { contains: searchParams.q, mode: "insensitive" };

  const events = await db.event
    .findMany({
      where,
      orderBy: { startsAt: "asc" },
      take: 60,
      include: { ticketTypes: { where: { isActive: true } } },
    })
    .catch(() => []);

  return (
    <div className="section py-16">
      <div className="max-w-3xl mb-10">
        <p className="chip-outline mb-4">Discover</p>
        <h1 className="h-section">Events worth showing up for.</h1>
        <p className="text-ink-muted mt-3 text-lg">Published, upcoming, and open for registration.</p>
      </div>

      <form className="mb-10 flex gap-2 flex-wrap">
        <input
          type="search"
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search events..."
          className="input max-w-sm"
        />
        <select name="category" defaultValue={searchParams.category ?? "All"} className="input max-w-xs">
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button type="submit" className="btn-primary btn-md">Search</button>
      </form>

      {events.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-ink-muted mb-6">No events match your search yet.</p>
          <Link href="/dashboard/events/new" className="btn-primary btn-md">
            Be the first - create an event
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5">
          {events.map((e) => {
            const min = Math.min(...e.ticketTypes.map((t) => t.priceMinor));
            return (
              <Link key={e.id} href={`/events/${e.slug}`} className="card overflow-hidden group hover:border-ink/20 transition">
                <div className="aspect-[4/5] bg-surface-2 overflow-hidden relative">
                  {e.flyerUrl ? (
                    <img src={e.flyerUrl} alt={e.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-700" />
                  ) : (
                    <div className="w-full h-full bg-aurora" />
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs text-ink-muted uppercase tracking-widest mb-1.5">
                    {formatDateShort(e.startsAt, e.timezone)}
                  </p>
                  <h3 className="font-display text-xl line-clamp-1 group-hover:text-royal-2 transition">{e.title}</h3>
                  <p className="text-sm text-ink-muted line-clamp-1 mt-1">{e.venue}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-semibold">
                      {e.type === "FREE" ? "Free" : `From ${formatMinorAmount(min, e.currency)}`}
                    </span>
                    <span className="chip-outline">{e.category}</span>
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
