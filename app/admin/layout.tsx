import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserOrRedirect, isAdmin } from "@/lib/auth";
import { Logo } from "@/components/Logo";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserOrRedirect("/admin");
  if (!isAdmin(user.role)) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-surface hidden md:flex flex-col p-5">
        <Logo size="sm" />
        <p className="text-xs font-bold text-crimson uppercase tracking-widest mt-6 mb-6">Admin</p>
        <nav className="flex flex-col gap-0.5 text-sm">
          <NavLink href="/admin">Overview</NavLink>
          <NavLink href="/admin/free-events">Free event queue</NavLink>
          <NavLink href="/admin/events">All events</NavLink>
          <NavLink href="/admin/organizers">Organizers</NavLink>
          <NavLink href="/admin/sms">SMS and Sender IDs</NavLink>
          <NavLink href="/admin/services">Service inquiries</NavLink>
          <NavLink href="/admin/support">Support</NavLink>
          <div className="mt-6 mb-2 text-[10px] text-ink-faint uppercase tracking-widest px-3">Account</div>
          <NavLink href="/dashboard">My dashboard</NavLink>
          <Link href="/api/auth/sign-out" className="px-3 py-2 rounded-lg text-ink-muted hover:bg-surface-2 hover:text-ink">Sign out</Link>
        </nav>
        <div className="mt-auto card p-4">
          <p className="text-xs text-ink-faint uppercase tracking-widest mb-1">Signed in</p>
          <p className="text-sm font-medium truncate">{user.email}</p>
          <p className="text-xs text-crimson mt-1">{user.role}</p>
        </div>
      </aside>
      <main className="md:ml-64 p-5 md:p-10 max-w-6xl">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="px-3 py-2 rounded-lg text-ink hover:bg-surface-2 transition">{children}</Link>
  );
}
