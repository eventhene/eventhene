import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { UserButton } from "@clerk/nextjs";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const organizer = await db.organizer.findUnique({ where: { userId: user.id } });
  if (!organizer) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-bg">
      <aside className="fixed left-0 top-0 h-screen w-60 border-r border-border bg-surface hidden md:flex flex-col p-4">
        <Link href="/" className="mb-8">
          <Logo />
        </Link>
        <nav className="flex flex-col gap-1 text-sm">
          <Link href="/dashboard" className="px-3 py-2 rounded-lg hover:bg-surface-2">Overview</Link>
          <Link href="/dashboard/events" className="px-3 py-2 rounded-lg hover:bg-surface-2">My events</Link>
          <Link href="/dashboard/events/new" className="px-3 py-2 rounded-lg hover:bg-surface-2 text-primary font-medium">+ Create event</Link>
          <Link href="/dashboard/staff" className="px-3 py-2 rounded-lg hover:bg-surface-2">Scanner staff</Link>
          <Link href="/dashboard/services" className="px-3 py-2 rounded-lg hover:bg-surface-2">Services</Link>
          <Link href="/dashboard/settings" className="px-3 py-2 rounded-lg hover:bg-surface-2">Settings</Link>
        </nav>
        <div className="mt-auto pt-4 border-t border-border flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <div className="text-xs">
            <p className="font-medium">{organizer.displayName}</p>
            <p className="text-ink-muted">{user.email}</p>
          </div>
        </div>
      </aside>

      <header className="md:hidden border-b border-border bg-surface px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <Link href="/"><Logo /></Link>
        <UserButton afterSignOutUrl="/" />
      </header>

      <main className="md:ml-60 p-4 md:p-8 pb-24 md:pb-8">{children}</main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-border flex justify-around py-2 z-30">
        <Link href="/dashboard" className="text-xs py-1 px-2">Home</Link>
        <Link href="/dashboard/events" className="text-xs py-1 px-2">Events</Link>
        <Link href="/dashboard/events/new" className="text-xs py-1 px-2 text-primary font-bold">+ New</Link>
        <Link href="/scan" className="text-xs py-1 px-2">Scan</Link>
        <Link href="/dashboard/settings" className="text-xs py-1 px-2">Settings</Link>
      </nav>
    </div>
  );
}
