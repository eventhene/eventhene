import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserOrRedirect } from "@/lib/auth";
import { Logo } from "@/components/Logo";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserOrRedirect("/dashboard");
  const organizer = await db.organizer.findUnique({ where: { userId: user.id } });
  if (!organizer) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-paper">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-surface hidden md:flex flex-col p-5">
        <Logo size="sm" />

        <nav className="flex flex-col gap-0.5 text-sm mt-10">
          <NavLink href="/dashboard">Overview</NavLink>
          <NavLink href="/dashboard/events">Events</NavLink>
          <NavLink href="/dashboard/events/new" accent>Create event</NavLink>
          <div className="mt-6 mb-2 text-[10px] text-ink-faint uppercase tracking-widest px-3">Tools</div>
          <NavLink href="/dashboard/sms">SMS</NavLink>
          <NavLink href="/scan">Scanner</NavLink>
          <NavLink href="/dashboard/staff">Scanner staff</NavLink>
          <NavLink href="/dashboard/services">Services</NavLink>
          <div className="mt-6 mb-2 text-[10px] text-ink-faint uppercase tracking-widest px-3">Account</div>
          <NavLink href="/dashboard/settings">Settings</NavLink>
          <Link
            href="/api/auth/sign-out"
            className="px-3 py-2 rounded-lg text-ink-muted hover:bg-surface-2 hover:text-ink transition"
          >
            Sign out
          </Link>
        </nav>

        <div className="mt-auto card p-4">
          <p className="text-xs text-ink-faint uppercase tracking-widest mb-1">Signed in</p>
          <p className="text-sm font-medium truncate">{organizer.displayName}</p>
          <p className="text-xs text-ink-muted truncate">{user.email}</p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 bg-surface/80 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <Logo size="sm" />
        <Link href="/api/auth/sign-out" className="text-xs text-ink-muted">Sign out</Link>
      </header>

      <main className="md:ml-64 p-5 md:p-10 pb-24 md:pb-10 max-w-6xl">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-border grid grid-cols-5 py-2 z-30">
        <MobileTab href="/dashboard" label="Home" />
        <MobileTab href="/dashboard/events" label="Events" />
        <MobileTab href="/dashboard/events/new" label="New" accent />
        <MobileTab href="/scan" label="Scan" />
        <MobileTab href="/dashboard/settings" label="Me" />
      </nav>
    </div>
  );
}

function NavLink({ href, children, accent }: { href: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-lg transition ${accent ? "font-medium text-royal-2 hover:bg-royal-2/5" : "text-ink hover:bg-surface-2"}`}
    >
      {children}
    </Link>
  );
}

function MobileTab({ href, label, accent }: { href: string; label: string; accent?: boolean }) {
  return (
    <Link
      href={href}
      className={`text-xs py-1.5 text-center ${accent ? "text-royal-2 font-semibold" : "text-ink-muted"}`}
    >
      {label}
    </Link>
  );
}
