import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-24">
      <div className="mx-auto max-w-6xl px-4 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <Logo />
          <p className="text-sm text-ink-muted mt-3 max-w-xs">
            Premium event ticketing & attendance. Built for Ghana. Ready for the world.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Platform</h4>
          <ul className="space-y-2 text-sm text-ink-muted">
            <li><Link href="/events">Browse Events</Link></li>
            <li><Link href="/pricing">Pricing</Link></li>
            <li><Link href="/services">Services</Link></li>
            <li><Link href="/tickets/lookup">Find my ticket</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">For organizers</h4>
          <ul className="space-y-2 text-sm text-ink-muted">
            <li><Link href="/dashboard/events/new">Create event</Link></li>
            <li><Link href="/dashboard">Dashboard</Link></li>
            <li><Link href="/about">About</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Legal</h4>
          <ul className="space-y-2 text-sm text-ink-muted">
            <li><Link href="/terms">Terms</Link></li>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/refund-policy">Refunds</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-ink-muted flex justify-between">
          <span>© {new Date().getFullYear()} EventHene. Long live the king.</span>
          <span>Made in Ghana 🇬🇭</span>
        </div>
      </div>
    </footer>
  );
}
