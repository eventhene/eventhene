import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function TopNav() {
  return (
    <header className="border-b border-border bg-bg/80 backdrop-blur sticky top-0 z-40">
      <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-ink-muted">
          <Link href="/events" className="hover:text-ink">Browse Events</Link>
          <Link href="/pricing" className="hover:text-ink">Pricing</Link>
          <Link href="/services" className="hover:text-ink">Services</Link>
          <Link href="/about" className="hover:text-ink">About</Link>
        </div>
        <div className="flex items-center gap-2">
          <SignedOut>
            <Link href="/login" className="btn-ghost text-sm">Sign in</Link>
            <Link href="/dashboard/events/new" className="btn-primary text-sm">Create event</Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="btn-ghost text-sm">Dashboard</Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
}
