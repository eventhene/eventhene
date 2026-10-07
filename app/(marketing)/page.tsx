import Link from "next/link";
import { db } from "@/lib/db";
import { formatMinorAmount, formatDateShort } from "@/lib/utils";
import { HeroSlideshow } from "@/components/marketing/HeroSlideshow";
import { TicketCard3D } from "@/components/marketing/TicketCard3D";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { Calendar, MapPin, Users, QrCode, MessageSquare, BarChart3, ArrowRight, Ticket, Zap, Shield } from "lucide-react";

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
      {/* ============ HERO - FULL SCREEN ============ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <HeroSlideshow />

        <div className="section relative z-10 pt-28 pb-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-accent tracking-wide uppercase mb-6">
              Now registering events in Ghana
            </p>

            <h1 className="h-mega text-white max-w-4xl text-balance">
              Your events,{" "}
              <span className="text-accent">elevated.</span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-white/60 max-w-2xl leading-relaxed font-medium">
              EventHene is the operating system for event organizers in Africa.
              Collect registrations, send bulk SMS to your crowd, scan QR tickets
              at the gate, and know exactly who showed up.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/sign-up" className="btn-gold btn-xl">
                Create your first event
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/events" className="btn-ghost-dark btn-xl">
                Browse events
              </Link>
            </div>
          </div>

          {/* Glassmorphic stat cards */}
          <div className="mt-10 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
            {[
              { value: "5 min", label: "to publish" },
              { value: "Free", label: "to list events" },
              { value: "5%", label: "per paid ticket" },
              { value: "24/7", label: "attendance exports" },
            ].map((s) => (
              <div
                key={s.label}
                className="card-glass rounded-2xl p-3 sm:p-4"
              >
                <p className="font-extrabold text-xl sm:text-2xl md:text-3xl text-white tracking-tight">{s.value}</p>
                <p className="text-[11px] text-white/40 uppercase tracking-widest mt-1 font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Glassmorphic floating cards on the right */}
        <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 z-10 flex-col gap-4 w-72">
          <div className="card-glass rounded-2xl p-5 animate-fade-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">Ticketing</p>
                <p className="text-sm font-bold text-white">QR-coded tickets</p>
              </div>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">Gold gradient design with HMAC-signed QR codes. Attendees screenshot them.</p>
          </div>

          <div className="card-glass rounded-2xl p-5 animate-fade-up" style={{ animationDelay: "0.5s", opacity: 0 }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald/15 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-emerald" />
              </div>
              <div>
                <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">SMS</p>
                <p className="text-sm font-bold text-white">Bulk broadcasts</p>
              </div>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">Send instant updates to every registrant with one click.</p>
          </div>

          <div className="card-glass rounded-2xl p-5 animate-fade-up" style={{ animationDelay: "0.8s", opacity: 0 }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-sky/15 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-sky" />
              </div>
              <div>
                <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">Check-in</p>
                <p className="text-sm font-bold text-white">Scan at the gate</p>
              </div>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">Instant QR scan verdict. Know exactly who showed up.</p>
          </div>
        </div>
      </section>

      {/* ============ CATEGORY STRIPS ============ */}
      <section className="py-14 md:py-20 overflow-hidden">
        <div className="section mb-10">
          <p className="text-sm font-semibold text-accent uppercase tracking-wide mb-3">Explore</p>
          <h2 className="h-section text-white">Find your kind of event.</h2>
        </div>
        <div className="section">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { label: "Music & Concerts", img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=80" },
              { label: "Faith & Worship", img: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400&q=80" },
              { label: "Conferences", img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80" },
              { label: "Weddings", img: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80" },
              { label: "Community", img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80" },
            ].map((cat) => (
              <Link
                key={cat.label}
                href="/events"
                className="group relative aspect-[3/5] rounded-2xl overflow-hidden"
              >
                <img
                  src={cat.img}
                  alt={cat.label}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-bold text-sm uppercase tracking-wider">{cat.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TICKET SHOWCASE ============ */}
      <section className="relative py-16 md:py-28">
        <div className="section">
          <ScrollReveal>
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-accent uppercase tracking-wide mb-4">The ticket</p>
              <h2 className="h-section text-white text-balance">
                Every ticket feels like a keepsake, not a receipt.
              </h2>
              <p className="mt-5 text-white/40 text-lg leading-relaxed">
                Gold gradient design, your flyer, HMAC-signed QR code, and a
                human-readable reference. Attendees screenshot them. Organizers love them.
              </p>
            </div>

            <div className="mt-16 flex flex-col gap-6 max-w-3xl mx-auto">
              <TicketCard3D variant="regular" />
              <TicketCard3D variant="vip" featured />
              <TicketCard3D variant="vvip" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============ FEATURE GRID ============ */}
      <section className="section py-16 md:py-28">
        <div className="max-w-3xl mb-10 md:mb-16">
          <p className="text-sm font-semibold text-accent uppercase tracking-wide mb-4">What's inside</p>
          <h2 className="h-section text-white">Everything you need, nothing you don't.</h2>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-6 gap-4">
          <FeatureCard className="sm:col-span-2 md:col-span-4" icon={<MessageSquare className="w-5 h-5 text-accent" />} label="Bulk SMS" title="Instant broadcasts to every registrant">
            <SmsPreview />
          </FeatureCard>
          <FeatureCard className="md:col-span-2" icon={<QrCode className="w-5 h-5 text-emerald" />} label="QR Check-in" title="Scan at the gate, instant verdict.">
            <ScanPreview />
          </FeatureCard>
          <FeatureCard className="md:col-span-2" icon={<Users className="w-5 h-5 text-sky" />} label="Registration" title="Collect exactly the fields you want.">
            <FieldPreview />
          </FeatureCard>
          <FeatureCard className="sm:col-span-2 md:col-span-4" icon={<BarChart3 className="w-5 h-5 text-accent" />} label="Attendance" title="Live dashboard, export anytime.">
            <DashboardPreview />
          </FeatureCard>
        </div>
      </section>

      {/* ============ FEATURED EVENTS ============ */}
      {featured.length > 0 && (
        <section className="py-16 md:py-28">
          <div className="section">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-sm font-semibold text-accent uppercase tracking-wide mb-4">Live now</p>
                <h2 className="h-section text-white">Upcoming events you can't miss.</h2>
              </div>
              <Link href="/events" className="btn-ghost btn-md hidden sm:inline-flex">
                See all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {featured.map((e) => {
                const min = Math.min(...e.ticketTypes.map((t) => t.priceMinor));
                return (
                  <Link key={e.id} href={`/events/${e.slug}`} className="group block card-dark rounded-2xl overflow-hidden hover:border-white/12 transition-all duration-300">
                    <div className="aspect-[4/5] bg-white/5 overflow-hidden relative">
                      {e.flyerUrl ? (
                        <img src={e.flyerUrl} alt={e.title} className="w-full h-full object-cover group-hover:scale-[1.05] transition duration-700" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-accent/20 to-transparent" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute inset-x-4 bottom-4 flex items-center justify-between">
                        <span className="text-xs font-semibold glass rounded-lg px-3 py-1.5 text-white">{e.category}</span>
                        <span className="text-xs font-bold bg-accent/90 text-accent-ink px-3 py-1.5 rounded-lg">
                          {e.type === "FREE" ? "Free" : `From ${formatMinorAmount(min, e.currency)}`}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-1.5">
                        {formatDateShort(e.startsAt, e.timezone)}
                      </p>
                      <h3 className="font-extrabold text-xl leading-tight line-clamp-2 text-white">{e.title}</h3>
                      <p className="text-sm text-white/40 mt-1.5 line-clamp-1 font-medium flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {e.venue}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============ SERVICES STRIP ============ */}
      <section className="section py-16 md:py-28">
        <div className="grid md:grid-cols-[1.1fr,1fr] gap-10 md:gap-16 items-center">
          <div>
            <p className="text-sm font-semibold text-accent uppercase tracking-wide mb-4">Need more?</p>
            <h2 className="h-section text-white text-balance">
              A full creative team, on call.
            </h2>
            <p className="mt-5 text-white/40 text-lg leading-relaxed max-w-md">
              Social campaigns, flyer design, livestream, photography, media coverage. One request, custom quote within 24 hours.
            </p>
            <div className="mt-8">
              <Link href="/services" className="btn-gold btn-lg">
                Explore services <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { title: "Graphic design", desc: "Flyers, stories, social kits", icon: <Zap className="w-5 h-5 text-accent" /> },
              { title: "Social media", desc: "Targeted IG, TikTok, WA", icon: <Users className="w-5 h-5 text-sky" /> },
              { title: "Livestream", desc: "Multi-cam broadcast", icon: <BarChart3 className="w-5 h-5 text-emerald" /> },
              { title: "Photography", desc: "Pro on the day", icon: <Shield className="w-5 h-5 text-accent" /> },
            ].map((s) => (
              <div key={s.title} className="card-glass rounded-2xl p-6">
                <div className="mb-3">{s.icon}</div>
                <p className="font-bold text-white">{s.title}</p>
                <p className="text-sm text-white/40 mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CLOSING CTA ============ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=80"
            alt="Event atmosphere"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-[#0a0a0c]/50" />
        </div>
        <div className="section py-20 md:py-32 relative text-center">
          <h2 className="h-hero text-white text-balance">
            Your next event,{" "}
            <span className="text-accent">elevated.</span>
          </h2>
          <p className="mt-6 text-white/50 text-lg max-w-xl mx-auto font-medium">
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

function FeatureCard({
  label,
  title,
  icon,
  children,
  className = "",
}: {
  label: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card-glass rounded-2xl p-7 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">{label}</p>
      </div>
      <h3 className="font-extrabold text-xl leading-tight max-w-sm tracking-tight text-white">{title}</h3>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function SmsPreview() {
  return (
    <div className="rounded-xl bg-white/5 p-5 text-sm border border-white/5">
      <div className="flex items-center gap-2 text-xs text-white/40 font-semibold mb-3">
        <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
        EventHene SMS - 342 recipients
      </div>
      <div className="rounded-lg bg-white/5 border border-white/8 p-4 text-white/80">
        Hi Kwame, your ticket for Fire Conference 2026 is confirmed.<br />
        Ref: KWA-FIRE-7241089<br />
        Show at the gate. See you there!
      </div>
      <div className="mt-3 flex gap-6 text-xs font-semibold text-white/40">
        <span>Sent 342</span>
        <span className="text-emerald">Delivered 338</span>
        <span className="text-crimson">Failed 4</span>
      </div>
    </div>
  );
}

function ScanPreview() {
  return (
    <div className="rounded-xl bg-emerald/10 border border-emerald/20 p-5">
      <div className="text-emerald text-sm font-bold mb-2">Welcome</div>
      <p className="font-extrabold text-xl leading-tight text-white">Kwame Asante</p>
      <p className="text-xs text-white/40 mt-1 font-medium">VIP - 20:14</p>
      <div className="mt-4 font-mono text-xs text-emerald font-semibold">KWA-FIRE-7241089</div>
    </div>
  );
}

function FieldPreview() {
  return (
    <div className="space-y-2">
      {["Full name", "Phone number", "Email", "City"].map((f, i) => (
        <div key={f} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-white/70">
          <span>{f}</span>
          <span className="text-[10px] font-semibold text-white/30 uppercase">{i < 3 ? "Required" : "Optional"}</span>
        </div>
      ))}
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { v: "342", l: "Registered" },
        { v: "289", l: "Attended" },
        { v: "GHS 51k", l: "Revenue" },
        { v: "84%", l: "Show rate" },
      ].map((k) => (
        <div key={k.l} className="rounded-xl bg-white/5 p-4 border border-white/5">
          <p className="font-extrabold text-xl sm:text-2xl text-white tracking-tight">{k.v}</p>
          <p className="text-xs text-white/40 mt-1 font-medium">{k.l}</p>
        </div>
      ))}
    </div>
  );
}
