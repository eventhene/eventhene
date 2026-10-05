import Link from "next/link";
import { db } from "@/lib/db";
import { formatMinorAmount, formatDateShort } from "@/lib/utils";
import { HeroCanvas } from "@/components/marketing/HeroCanvas";
import { TicketCard3D } from "@/components/marketing/TicketCard3D";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

export default async function HomePage() {
  const featured = await db.event
    .findMany({
      where: { status: "PUBLISHED", endsAt: { gt: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 6,
      include: { ticketTypes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    })
    .catch(() => []);

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-aurora text-white">
        <div className="absolute inset-0 bg-grid-dark pointer-events-none" />
        <HeroCanvas />

        <div className="section relative z-10 pt-28 pb-32">
          <div className="flex items-center gap-2 mb-8">
            <span className="chip-dark">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
              Now registering real events in Accra
            </span>
          </div>

          <h1 className="h-mega text-white max-w-5xl text-balance">
            Run events like <span className="italic text-accent">royalty</span>.
            <br />
            <span className="text-white/60">Register. Scan. Send SMS.</span>
          </h1>

          <p className="mt-8 text-lg md:text-xl text-white/70 max-w-2xl leading-relaxed">
            EventHene is the operating system for African event organizers. Collect registrations,
            send bulk SMS to your crowd, scan QR tickets at the gate, and know exactly who showed up.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/sign-up" className="btn-gold btn-xl">
              Create your first event
            </Link>
            <Link href="/events" className="btn-ghost-dark btn-xl">
              Browse events
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-5 max-w-3xl">
            <HeroStat value="5 min" label="to publish" />
            <HeroStat value="0%" label="to list free events" />
            <HeroStat value="5%" label="per paid ticket" />
            <HeroStat value="24/7" label="attendance exports" />
          </div>
        </div>
      </section>

      {/* ============ TICKET SHOWCASE ============ */}
      <section className="relative bg-paper py-28">
        <div className="section">
          <ScrollReveal>
            <div className="max-w-2xl">
              <p className="chip-outline mb-6">01 - The ticket</p>
              <h2 className="h-section text-balance">
                Every ticket feels like a <span className="font-display italic text-royal-2">keepsake</span>, not a receipt.
              </h2>
              <p className="mt-5 text-ink-muted text-lg leading-relaxed">
                Royal purple gradient, your flyer, a crown watermark, HMAC-signed QR code, and a
                human-readable reference like <span className="font-mono text-ink">WOR-DJKAY-4134123</span>.
                Attendees screenshot them. Organizers love them.
              </p>
            </div>

            <div className="mt-16 grid md:grid-cols-3 gap-6 items-end">
              <TicketCard3D variant="regular" />
              <TicketCard3D variant="vip" featured />
              <TicketCard3D variant="vvip" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============ FEATURE GRID ============ */}
      <section className="section py-28">
        <div className="max-w-3xl mb-16">
          <p className="chip-outline mb-6">02 - What's inside</p>
          <h2 className="h-section">Everything you need, nothing you don't.</h2>
        </div>

        <div className="grid md:grid-cols-6 gap-4">
          <FeatureCard className="md:col-span-4" label="Bulk SMS" title="Hubtel-powered broadcasts to every registrant">
            <SmsPreview />
          </FeatureCard>
          <FeatureCard className="md:col-span-2" label="QR Check-in" title="Scan at the gate, instant verdict.">
            <ScanPreview />
          </FeatureCard>
          <FeatureCard className="md:col-span-2" label="Registration" title="Collect exactly the fields you want.">
            <FieldPreview />
          </FeatureCard>
          <FeatureCard className="md:col-span-4" label="Attendance" title="Live dashboard, export anytime.">
            <DashboardPreview />
          </FeatureCard>
        </div>
      </section>

      {/* ============ FEATURED EVENTS ============ */}
      {featured.length > 0 && (
        <section className="bg-canvas text-white py-28">
          <div className="section">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="chip-dark mb-6">03 - Live now</p>
                <h2 className="h-section text-white">Events worth showing up for.</h2>
              </div>
              <Link href="/events" className="btn-ghost-dark btn-md hidden sm:inline-flex">
                See all
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {featured.map((e) => {
                const min = Math.min(...e.ticketTypes.map((t) => t.priceMinor));
                return (
                  <Link key={e.id} href={`/events/${e.slug}`} className="group block card-dark overflow-hidden">
                    <div className="aspect-[4/5] bg-white/5 overflow-hidden relative">
                      {e.flyerUrl ? (
                        <img src={e.flyerUrl} alt={e.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-700" />
                      ) : (
                        <div className="w-full h-full bg-aurora" />
                      )}
                      <div className="absolute inset-x-4 bottom-4 flex items-center justify-between">
                        <span className="chip-dark backdrop-blur-xl">{e.category}</span>
                        <span className="chip-gold">{e.type === "FREE" ? "Free" : `From ${formatMinorAmount(min, e.currency)}`}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-xs text-white/50 uppercase tracking-widest mb-1.5">
                        {formatDateShort(e.startsAt, e.timezone)}
                      </p>
                      <h3 className="font-display text-2xl leading-tight line-clamp-2">{e.title}</h3>
                      <p className="text-sm text-white/50 mt-1 line-clamp-1">{e.venue}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============ SERVICES STRIP ============ */}
      <section className="section py-28">
        <div className="grid md:grid-cols-[1.1fr,1fr] gap-16 items-center">
          <div>
            <p className="chip-outline mb-6">04 - Need more?</p>
            <h2 className="h-section text-balance">
              A full creative team, <span className="font-display italic text-royal-2">on call</span>.
            </h2>
            <p className="mt-5 text-ink-muted text-lg leading-relaxed max-w-md">
              Social campaigns, flyer design, livestream, photography, media coverage. One request, custom quote within 24 hours.
            </p>
            <div className="mt-8">
              <Link href="/services" className="btn-primary btn-lg">Explore services</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { emoji: "🎨", title: "Graphic design", desc: "Flyers, stories, social kits" },
              { emoji: "📣", title: "Social media", desc: "Targeted IG, TikTok, WA" },
              { emoji: "📡", title: "Livestream", desc: "Multi-cam broadcast" },
              { emoji: "📸", title: "Photography", desc: "Pro on the day" },
            ].map((s) => (
              <div key={s.title} className="card p-6">
                <div className="text-3xl mb-3">{s.emoji}</div>
                <p className="font-medium text-ink">{s.title}</p>
                <p className="text-sm text-ink-muted mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CLOSING CTA ============ */}
      <section className="bg-canvas text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-aurora opacity-60" />
        <div className="section py-28 relative text-center">
          <h2 className="h-hero text-balance">
            Run your next event like <span className="italic text-accent">royalty</span>.
          </h2>
          <p className="mt-6 text-white/70 text-lg max-w-xl mx-auto">
            Free to publish. 5% per paid ticket. Zero monthly fees.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/sign-up" className="btn-gold btn-xl">Create your event</Link>
            <Link href="/pricing" className="btn-ghost-dark btn-xl">See pricing</Link>
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------- small presentational blocks ---------- */

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-t border-white/15 pt-3">
      <p className="font-display text-4xl text-white">{value}</p>
      <p className="text-xs text-white/50 uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}

function FeatureCard({
  label,
  title,
  children,
  className = "",
}: {
  label: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card p-7 ${className}`}>
      <p className="text-xs text-ink-muted uppercase tracking-widest mb-3">{label}</p>
      <h3 className="font-display text-2xl leading-tight max-w-sm">{title}</h3>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function SmsPreview() {
  return (
    <div className="rounded-xl bg-surface-2 p-5 font-mono text-sm">
      <div className="flex items-center gap-2 text-xs text-ink-muted mb-3">
        <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
        Hubtel · DJKAY · 342 recipients
      </div>
      <div className="rounded-lg bg-white border border-border p-4 text-ink">
        Hi Worship, your ticket for DJ Kay Birthday Bash is confirmed.<br />
        Ref: WOR-DJKAY-4134123<br />
        Show at the gate. See you there! - EventHene
      </div>
      <div className="mt-3 flex gap-6 text-xs text-ink-muted">
        <span>Sent 342</span>
        <span className="text-emerald">Delivered 338</span>
        <span>Failed 4</span>
      </div>
    </div>
  );
}

function ScanPreview() {
  return (
    <div className="rounded-xl bg-emerald/10 border border-emerald/20 p-5">
      <div className="text-emerald text-sm font-medium mb-2">✓ Welcome</div>
      <p className="font-display text-xl leading-tight">Worship Mensah</p>
      <p className="text-xs text-ink-muted mt-1">VIP · 20:14</p>
      <div className="mt-4 font-mono text-xs text-emerald">WOR-DJKAY-4134123</div>
    </div>
  );
}

function FieldPreview() {
  return (
    <div className="space-y-2">
      {["Full name", "Phone number", "Email", "City"].map((f, i) => (
        <div key={f} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
          <span>{f}</span>
          <span className="chip-outline text-[10px]">{i < 3 ? "Required" : "Optional"}</span>
        </div>
      ))}
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {[
        { v: "342", l: "Sold" },
        { v: "289", l: "Attended" },
        { v: "GHS 51k", l: "Revenue" },
        { v: "84%", l: "Show rate" },
      ].map((k) => (
        <div key={k.l} className="rounded-xl bg-surface-2 p-4">
          <p className="font-display text-2xl text-ink">{k.v}</p>
          <p className="text-xs text-ink-muted mt-1">{k.l}</p>
        </div>
      ))}
    </div>
  );
}
