import Link from "next/link";

export const metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="h-display text-5xl mb-3">Pricing built for organizers, not platforms.</h1>
        <p className="text-ink-muted text-lg">No monthly fees. No setup fees. Pay only when you sell.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-8">
          <p className="chip-info mb-3">Most events</p>
          <h2 className="h-display text-3xl mb-1">Free events</h2>
          <p className="text-5xl font-bold mt-4 mb-2">GHS 0</p>
          <p className="text-ink-muted text-sm mb-6">Free forever. Subject to quick review so the platform stays trusted.</p>
          <ul className="space-y-2 text-sm">
            <li>✓ Beautiful public event page</li>
            <li>✓ QR-secured digital tickets</li>
            <li>✓ Email delivery</li>
            <li>✓ Attendance tracking + export</li>
            <li>✓ Reviewed within 24 hours</li>
          </ul>
          <Link href="/dashboard/events/new" className="btn-secondary w-full mt-6 justify-center">Create a free event</Link>
        </div>

        <div className="card p-8 border-2 border-primary relative">
          <span className="absolute -top-3 right-6 chip bg-primary text-white">For paid events</span>
          <h2 className="h-display text-3xl mb-1">Paid events</h2>
          <p className="text-5xl font-bold mt-4 mb-2">5%</p>
          <p className="text-ink-muted text-sm mb-6">Per ticket sold. Payment processor fee separate (Paystack ~1.95%).</p>
          <ul className="space-y-2 text-sm">
            <li>✓ Everything in free events</li>
            <li>✓ Mobile Money + card + bank</li>
            <li>✓ Branded PDF tickets</li>
            <li>✓ Choose: buyer pays fee OR you absorb it</li>
            <li>✓ Instant publish — no review</li>
          </ul>
          <Link href="/dashboard/events/new" className="btn-primary w-full mt-6 justify-center">Create a paid event</Link>
        </div>
      </div>

      <div className="card p-8 mt-8">
        <h3 className="h-display text-2xl mb-4">Promotions <span className="text-sm font-sans text-ink-muted">(optional)</span></h3>
        <div className="grid md:grid-cols-3 gap-4">
          <PriceItem name="Basic Boost" price="GHS 39" desc="Higher in search results · 7 days" />
          <PriceItem name="Featured Listing" price="GHS 99" desc="Featured strip on browse · 7 days" />
          <PriceItem name="Homepage Spotlight" price="GHS 199" desc="Top of homepage · 3 days" />
        </div>
      </div>

      <div className="card p-8 mt-6">
        <h3 className="h-display text-2xl mb-2">Extra services <span className="text-sm font-sans text-ink-muted">(by request)</span></h3>
        <p className="text-ink-muted text-sm mb-4">
          Social media promotion, graphic design, livestream, photography, media coverage.
          Custom quotes — we'll be in touch within 24 hours.
        </p>
        <Link href="/services" className="btn-secondary">Explore services</Link>
      </div>

      <p className="text-center text-xs text-ink-muted mt-12">
        Prices shown in GHS. Multi-country pricing available — your event uses the currency you choose at creation.
      </p>
    </div>
  );
}

function PriceItem({ name, price, desc }: { name: string; price: string; desc: string }) {
  return (
    <div className="rounded-xl bg-surface-2 p-5">
      <p className="text-sm text-ink-muted">{name}</p>
      <p className="text-2xl font-display font-bold mt-1">{price}</p>
      <p className="text-xs text-ink-muted mt-2">{desc}</p>
    </div>
  );
}
