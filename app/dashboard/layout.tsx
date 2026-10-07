import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserOrRedirect } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  MessageSquare,
  ScanLine,
  Users,
  Briefcase,
  Settings,
  LogOut,
} from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserOrRedirect("/dashboard");
  const organizer = await db.organizer.findUnique({ where: { userId: user.id } });
  if (!organizer) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <aside className="fixed left-0 top-0 h-screen w-[260px] hidden md:flex flex-col">
        <div className="m-3 flex-1 flex flex-col rounded-2xl card-glass p-5 overflow-y-auto">
          <Logo invert size="sm" />

          <div className="mt-8 flex-1 flex flex-col gap-0.5">
            <SideSection label="Menu" />
            <NavLink href="/dashboard" icon={<LayoutDashboard className="w-[18px] h-[18px]" />}>Overview</NavLink>
            <NavLink href="/dashboard/events" icon={<CalendarDays className="w-[18px] h-[18px]" />}>Events</NavLink>
            <NavLink href="/dashboard/events/new" icon={<PlusCircle className="w-[18px] h-[18px]" />} accent>Create event</NavLink>

            <SideSection label="Tools" />
            <NavLink href="/dashboard/sms" icon={<MessageSquare className="w-[18px] h-[18px]" />}>SMS</NavLink>
            <NavLink href="/scan" icon={<ScanLine className="w-[18px] h-[18px]" />}>Scanner</NavLink>
            <NavLink href="/dashboard/staff" icon={<Users className="w-[18px] h-[18px]" />}>Scanner staff</NavLink>
            <NavLink href="/dashboard/services" icon={<Briefcase className="w-[18px] h-[18px]" />}>Services</NavLink>

            <SideSection label="Account" />
            <NavLink href="/dashboard/settings" icon={<Settings className="w-[18px] h-[18px]" />}>Settings</NavLink>
            <Link
              href="/api/auth/sign-out"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition font-medium"
            >
              <LogOut className="w-[18px] h-[18px]" />
              Sign out
            </Link>
          </div>

          <div className="mt-4 rounded-xl bg-white/5 border border-white/8 p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                {organizer.displayName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{organizer.displayName}</p>
                <p className="text-[11px] text-white/40 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <header className="md:hidden sticky top-0 z-30 glass-dark px-4 py-3 flex items-center justify-between">
        <Logo invert size="sm" />
        <Link href="/api/auth/sign-out" className="text-xs text-white/40 font-semibold hover:text-white/60 transition">Sign out</Link>
      </header>

      <main className="md:ml-[260px] p-5 md:p-10 pb-24 md:pb-10 max-w-6xl">
        {children}
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 glass-dark grid grid-cols-5 py-2 z-30">
        <MobileTab href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Home" />
        <MobileTab href="/dashboard/events" icon={<CalendarDays className="w-4 h-4" />} label="Events" />
        <MobileTab href="/dashboard/events/new" icon={<PlusCircle className="w-4 h-4" />} label="New" accent />
        <MobileTab href="/scan" icon={<ScanLine className="w-4 h-4" />} label="Scan" />
        <MobileTab href="/dashboard/settings" icon={<Settings className="w-4 h-4" />} label="Me" />
      </nav>
    </div>
  );
}

function SideSection({ label }: { label: string }) {
  return (
    <p className="text-[10px] text-white/25 uppercase tracking-[0.15em] font-semibold px-3 mt-5 mb-1.5">{label}</p>
  );
}

function NavLink({
  href,
  children,
  icon,
  accent,
}: {
  href: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-sm font-medium ${
        accent
          ? "text-accent hover:bg-accent/10"
          : "text-white/60 hover:text-white hover:bg-white/5"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

function MobileTab({
  href,
  label,
  icon,
  accent,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 text-[10px] py-1.5 font-semibold ${
        accent ? "text-accent" : "text-white/40"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
