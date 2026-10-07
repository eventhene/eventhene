import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="relative bg-[#060608] text-white/80 border-t border-white/5">
      <div className="section py-14 md:py-20 grid grid-cols-2 md:grid-cols-[1.3fr,1fr,1fr,1fr] gap-8 md:gap-10">
        <div className="col-span-2 md:col-span-1">
          <Logo invert size="lg" />
          <p className="mt-5 text-white/40 max-w-xs text-sm leading-relaxed font-medium">
            Event registration, ticketing, bulk SMS and attendance tracking. Built in Ghana. Ready for the continent.
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
      <div className="section flex flex-col sm:flex-row items-center justify-between gap-2 py-6 text-xs text-white/30 font-semibold">
        <span>&copy; {new Date().getFullYear()} EventHene</span>
        <span className="tracking-widest uppercase">Made in Ghana</span>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-4">{title}</p>
      <ul className="space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-white/50 hover:text-white transition font-medium">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
