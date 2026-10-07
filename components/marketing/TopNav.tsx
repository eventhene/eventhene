import Link from "next/link";
import { Logo } from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth";

export async function TopNav({ invert = false }: { invert?: boolean }) {
  const user = await getCurrentUser();

  return (
    <header
      className="fixed top-0 inset-x-0 z-40 glass-dark"
    >
      <nav className="section flex h-16 items-center justify-between">
        <Logo invert />

        <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-white/50">
          <Link href="/events" className="hover:text-white transition">Discover</Link>
          <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
          <Link href="/services" className="hover:text-white transition">Services</Link>
          <Link href="/tickets/lookup" className="hover:text-white transition">Find ticket</Link>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/dashboard" className="btn-ghost-dark btn-md">Dashboard</Link>
              <Link href="/dashboard/events/new" className="btn-gold btn-md">New event</Link>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="btn-ghost-dark btn-md">Sign in</Link>
              <Link href="/sign-up" className="btn-gold btn-md">Get started</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
