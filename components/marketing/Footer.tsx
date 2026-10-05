import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="bg-canvas text-white/80 mt-32">
      <div className="section py-20 grid md:grid-cols-[1.3fr,1fr,1fr,1fr] gap-10">
        <div>
          <Logo invert size="lg" />
          <p className="mt-5 text-white/60 max-w-xs text-sm leading-relaxed">
            Premium event registration, ticketing, bulk SMS and attendance tracking. Built in Ghana. Ready for the continent.
          </p>
          <div className="mt-6 flex gap-2">
            <Link href="/sign-up" className="btn-gold btn-md">Start free</Link>
            <Link href="/events" className="btn-ghost-dark btn-md">Browse</Link>
          </div>
        </div>
        <FooterCol title="Platform" links={[
          { href: "/events", label: "Discover events" },
          { href: "/pricing", label: "Pricing" },
          { href: "/services", label: "Services" },
          { href: "/tickets/lookup", label: "Find ticket" },
        ]} />
        <FooterCol title="Organizers" links={[
          { href: "/dashboard/events/new", label: "Create event" },
          { href: "/dashboard", label: "Dashboard" },
          { href: "/about", label: "About" },
        ]} />
        <FooterCol title="Legal" links={[
          { href: "/terms", label: "Terms" },
          { href: "/privacy", label: "Privacy" },
          { href: "/refund-policy", label: "Refunds" },
          { href: "/contact", label: "Contact" },
        ]} />
      </div>
      <div className="hr-dark" />
      <div className="section flex flex-col sm:flex-row items-center justify-between gap-2 py-6 text-xs text-white/50">
        <span>© {new Date().getFullYear()} EventHene. Long live the king.</span>
        <span className="font-mono tracking-widest">MADE IN GHANA</span>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-xs text-white/40 uppercase tracking-widest mb-4">{title}</p>
      <ul className="space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-white/70 hover:text-white transition">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
