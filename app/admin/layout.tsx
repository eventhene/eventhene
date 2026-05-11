import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser, isAdmin } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { UserButton } from "@clerk/nextjs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!isAdmin(user.role)) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-bg">
      <aside className="fixed left-0 top-0 h-screen w-60 border-r border-border bg-surface hidden md:flex flex-col p-4">
        <Link href="/" className="mb-2">
          <Logo />
        </Link>
        <p className="chip-danger w-fit mb-6">Admin</p>
        <nav className="flex flex-col gap-1 text-sm">
          <Link href="/admin" className="px-3 py-2 rounded-lg hover:bg-surface-2">Overview</Link>
          <Link href="/admin/free-events" className="px-3 py-2 rounded-lg hover:bg-surface-2">Free event queue</Link>
          <Link href="/admin/events" className="px-3 py-2 rounded-lg hover:bg-surface-2">All events</Link>
          <Link href="/admin/organizers" className="px-3 py-2 rounded-lg hover:bg-surface-2">Organizers</Link>
          <Link href="/admin/services" className="px-3 py-2 rounded-lg hover:bg-surface-2">Service inquiries</Link>
          <Link href="/admin/support" className="px-3 py-2 rounded-lg hover:bg-surface-2">Support</Link>
        </nav>
        <div className="mt-auto pt-4 border-t border-border flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <p className="text-xs">{user.email}</p>
        </div>
      </aside>
      <main className="md:ml-60 p-4 md:p-8">{children}</main>
    </div>
  );
}
