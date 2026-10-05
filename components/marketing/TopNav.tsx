import Link from "next/link";
import { Logo } from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth";

export async function TopNav({ invert = false }: { invert?: boolean }) {
  const user = await getCurrentUser();

  return (
    <header className={`sticky top-0 z-40 ${invert ? "bg-canvas/60" : "bg-bg/60"} backdrop-blur-xl border-b ${invert ? "border-white/5" : "border-border"}`}>
      <nav className="section flex h-16 items-center justify-between">
        <Logo invert={invert} />

        <div className={`hidden md:flex items-center gap-7 text-sm ${invert ? "text-white/70" : "text-ink-muted"}`}>
          <Link href="/events" className={`hover:${invert ? "text-white" : "text-ink"} transition`}>Discover</Link>
          <Link href="/pricing" className={`hover:${invert ? "text-white" : "text-ink"} transition`}>Pricing</Link>
          <Link href="/services" className={`hover:${invert ? "text-white" : "text-ink"} transition`}>Services</Link>
          <Link href="/tickets/lookup" className={`hover:${invert ? "text-white" : "text-ink"} transition`}>Find ticket</Link>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/dashboard" className={invert ? "btn-ghost-dark btn-md" : "btn-ghost btn-md"}>Dashboard</Link>
              <Link href="/dashboard/events/new" className="btn-primary btn-md">New event</Link>
            </>
          ) : (
            <>
              <Link href="/sign-in" className={invert ? "btn-ghost-dark btn-md" : "btn-ghost btn-md"}>Sign in</Link>
              <Link href="/sign-up" className="btn-primary btn-md">Get started</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
