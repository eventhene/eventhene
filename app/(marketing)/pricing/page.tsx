import Link from "next/link";

export const metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <div className="section py-16 lg:py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <p className="chip-outline mb-5 mx-auto w-fit">Pricing</p>
        <h1 className="h-section text-balance">Built for organizers, not platforms.</h1>
        <p className="text-ink-muted text-lg mt-5">No monthly fees. No setup fees. Pay only when you sell.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
        <div className="card p-8">
          <p className="chip-outline mb-4">Most events</p>
          <h2 className="h-card">Free events</h2>
          <p className="font-display text-6xl mt-6">GHS 0</p>
          <p className="text-ink-muted text-sm mt-2 mb-7">Free forever. Subject to quick review for trust.</p>
          <ul className="space-y-2.5 text-sm">
            {[
              "Beautiful public event page",
              "QR-secured digital tickets",
              "Email delivery",
              "Attendance tracking + export",
              "Bulk SMS (Hubtel, pay per message)",
              "Reviewed within 24 hours",
            ].map((f) => <li key={f}>✓ {f}</li>)}
          </ul>
          <Link href="/sign-up" className="btn-ghost btn-lg w-full mt-7">Create a free event</Link>
        </div>

        <div className="card p-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-royal-2/15 rounded-full blur-3xl pointer-events-none" />
          <span className="chip-gold mb-4">Paid events</span>
          <h2 className="h-card">Ticketing</h2>
          <p className="font-display text-6xl mt-6">5%</p>
          <p className="text-ink-muted text-sm mt-2 mb-7">Per ticket sold. Payment processor fee separate.</p>
          <ul className="space-y-2.5 text-sm">
            {[
              "Everything in free events",
              "Mobile Money + card + bank",
              "Branded PDF tickets",
              "Choose: buyer pays fee OR you absorb",
              "Instant publish - no review",
            ].map((f) => <li key={f}>✓ {f}</li>)}
          </ul>
          <Link href="/sign-up" className="btn-primary btn-lg w-full mt-7">Create a paid event</Link>
        </div>
      </div>

      <div className="card p-8 mt-6 max-w-4xl mx-auto">
        <h3 className="h-card mb-5">Promotions <span className="text-sm font-sans text-ink-muted">(optional)</span></h3>
        <div className="grid md:grid-cols-3 gap-4">
          <PriceItem name="Basic Boost" price="GHS 39" desc="Higher in search results · 7 days" />
          <PriceItem name="Featured Listing" price="GHS 99" desc="Featured strip on browse · 7 days" />
          <PriceItem name="Homepage Spotlight" price="GHS 199" desc="Top of homepage · 3 days" />
        </div>
      </div>

      <div className="card p-8 mt-5 max-w-4xl mx-auto">
        <h3 className="h-card mb-2">Extra services <span className="text-sm font-sans text-ink-muted">(by request)</span></h3>
        <p className="text-ink-muted text-sm mb-5">
          Social media promotion, graphic design, livestream, photography, media coverage. Custom quotes within 24 hours.
        </p>
        <Link href="/services" className="btn-ghost btn-md">Explore services</Link>
      </div>
    </div>
  );
}

function PriceItem({ name, price, desc }: { name: string; price: string; desc: string }) {
  return (
    <div className="rounded-xl bg-surface-2 p-5">
      <p className="text-sm text-ink-muted">{name}</p>
      <p className="font-display text-3xl mt-1">{price}</p>
      <p className="text-xs text-ink-muted mt-2">{desc}</p>
    </div>
  );
}
