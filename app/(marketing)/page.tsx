import Link from "next/link";
import { db } from "@/lib/db";
import { formatMinorAmount, formatDateShort } from "@/lib/utils";

export default async function HomePage() {
  // Featured published events
  const featured = await db.event
    .findMany({
      where: { status: "PUBLISHED", endsAt: { gt: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 6,
      include: { ticketTypes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } }
    })
    .catch(() => []);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-royal-gradient opacity-[0.03]" />
        <div className="mx-auto max-w-6xl px-4 pt-20 pb-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="chip-info mb-4">Made for organizers</span>
            <h1 className="h-display text-5xl md:text-6xl font-bold leading-[1.05] mb-4">
              Run a <span className="text-primary">kingly</span> event.
              <span className="text-accent">♛</span>
            </h1>
            <p className="text-lg text-ink-muted mb-6 max-w-lg">
              EventHene gives organizers a beautiful event page, secure QR tickets,
              real attendance tracking, and the support services to fill every seat.
              Free to publish. 5% per paid ticket.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/events/new" className="btn-primary">Create your event — free</Link>
              <Link href="/events" className="btn-secondary">Browse events</Link>
            </div>
            <p className="text-xs text-ink-muted mt-4">
              No monthly fees. No card required to publish.
            </p>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] rounded-3xl bg-royal-gradient shadow-lift flex items-center justify-center text-white">
              <div className="text-center p-8">
                <p className="text-accent text-sm tracking-[0.3em] mb-2">EVENT • HENE ♛</p>
                <h3 className="font-display text-3xl mb-2">DJ Kay<br/>Birthday Bash</h3>
                <p className="text-sm opacity-80">Fri, Jun 12 • East Legon, Accra</p>
                <div className="mt-6 inline-block bg-white text-ink rounded-xl px-4 py-3">
                  <p className="font-mono text-sm">WOR-DJKAY-4134123</p>
                </div>
                <p className="text-xs mt-3 opacity-70">Scan at entry</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="h-display text-3xl mb-2 text-center">How EventHene works</h2>
        <p className="text-center text-ink-muted mb-10">From idea to sold-out in three steps.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: "01", t: "Create", d: "Publish your event page with flyer, ticket types, and the attendee info you want to collect." },
            { n: "02", t: "Sell", d: "Share your link. Buyers pay with Mobile Money, cards, or bank. Tickets auto-email with a QR." },
            { n: "03", t: "Scan & Track", d: "Scan QR codes at the gate. Export attendance to Excel. Know who came." }
          ].map((s) => (
            <div key={s.n} className="card p-6">
              <p className="text-accent font-mono text-sm mb-2">{s.n}</p>
              <h3 className="h-display text-xl mb-1">{s.t}</h3>
              <p className="text-sm text-ink-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="h-display text-3xl">Featured this week</h2>
              <p className="text-ink-muted text-sm">Events on EventHene right now.</p>
            </div>
            <Link href="/events" className="btn-ghost text-sm">View all →</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featured.map((e) => {
              const min = Math.min(...e.ticketTypes.map((t) => t.priceMinor));
              return (
                <Link key={e.id} href={`/events/${e.slug}`} className="card overflow-hidden group">
                  <div className="aspect-[4/5] bg-surface-2 overflow-hidden">
                    {e.flyerUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.flyerUrl} alt={e.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-accent uppercase tracking-wider mb-1">
                      {formatDateShort(e.startsAt, e.timezone)}
                    </p>
                    <h3 className="font-display text-xl line-clamp-1">{e.title}</h3>
                    <p className="text-sm text-ink-muted line-clamp-1 mt-1">{e.venue}</p>
                    <p className="text-sm font-semibold mt-3">
                      {e.type === "FREE" ? "Free" : `From ${formatMinorAmount(min, e.currency)}`}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* SERVICES */}
      <section className="bg-surface border-y border-border py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="h-display text-3xl mb-2">More than a ticket platform</h2>
          <p className="text-ink-muted mb-8 max-w-2xl">
            Need flyer design, social media promotion, livestreaming or event-day photography?
            EventHene's creative network helps you put on a show worth talking about.
          </p>
          <Link href="/services" className="btn-gold">Explore services</Link>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="h-display text-3xl mb-2">Simple, kingly pricing.</h2>
        <p className="text-ink-muted mb-6">Free events: free forever. Paid events: 5% per ticket. No monthly fees.</p>
        <Link href="/pricing" className="btn-secondary">See pricing details</Link>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="h-display text-4xl md:text-5xl mb-4">Run your next event like royalty.</h2>
        <p className="text-ink-muted mb-6">Publish in 5 minutes. No card required.</p>
        <Link href="/dashboard/events/new" className="btn-primary text-lg px-8 py-4">
          Create your event — free
        </Link>
      </section>
    </>
  );
}
