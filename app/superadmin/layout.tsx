import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserOrRedirect, isAdmin } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { SignOutButton } from "@/components/SignOutButton";
import { PhoneVerifyCard } from "@/components/admin/PhoneVerifyCard";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  MessageSquare,
  Headphones,
  Briefcase,
  Shield,
  ArrowLeft,
  ListChecks,
  Mail,
  Ticket,
  Globe,
} from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserOrRedirect("/superadmin");
  if (!isAdmin(user.role)) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <aside className="fixed left-0 top-0 h-screen w-[260px] hidden md:flex flex-col">
        <div className="m-3 flex-1 flex flex-col rounded-2xl card-glass p-5 overflow-y-auto">
          <Logo variant="icon" size="md" />
          <div className="mt-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-crimson" />
            <span className="text-[10px] font-bold text-crimson uppercase tracking-widest">Admin</span>
          </div>

          <div className="mt-6 flex-1 flex flex-col gap-0.5">
            <SideSection label="Manage" />
            <NavLink href="/superadmin" icon={<LayoutDashboard className="w-[18px] h-[18px]" />}>Overview</NavLink>
            <NavLink href="/superadmin/free-events" icon={<ListChecks className="w-[18px] h-[18px]" />}>Free event queue</NavLink>
            <NavLink href="/superadmin/events" icon={<CalendarDays className="w-[18px] h-[18px]" />}>All events</NavLink>
            <NavLink href="/superadmin/organizers" icon={<Users className="w-[18px] h-[18px]" />}>Organizers</NavLink>

            <SideSection label="Operations" />
            <NavLink href="/superadmin/sms" icon={<MessageSquare className="w-[18px] h-[18px]" />}>SMS and Sender IDs</NavLink>
            <NavLink href="/superadmin/services" icon={<Briefcase className="w-[18px] h-[18px]" />}>Service inquiries</NavLink>
            <NavLink href="/superadmin/support" icon={<Headphones className="w-[18px] h-[18px]" />}>Support</NavLink>
            <NavLink href="/superadmin/coupons" icon={<Ticket className="w-[18px] h-[18px]" />}>Coupons</NavLink>
            <NavLink href="/superadmin/email" icon={<Mail className="w-[18px] h-[18px]" />}>Email setup</NavLink>
            <NavLink href="/superadmin/domain" icon={<Globe className="w-[18px] h-[18px]" />}>Domain</NavLink>

            <SideSection label="Account" />
            <NavLink href="/dashboard" icon={<ArrowLeft className="w-[18px] h-[18px]" />}>My dashboard</NavLink>
            <SignOutButton className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition font-medium w-full text-left" />
          </div>

          <div className="mt-4 rounded-xl bg-white/5 border border-white/8 p-4">
            <p className="text-sm font-bold text-white truncate">{user.email}</p>
            <p className="text-[11px] text-crimson font-semibold mt-0.5">{user.role}</p>
          </div>
        </div>
      </aside>
      <main className="md:ml-[260px] p-5 md:p-10 max-w-6xl">
        {!user.phoneVerified && <PhoneVerifyCard defaultPhone={user.phone} />}
        {children}
      </main>
    </div>
  );
}

function SideSection({ label }: { label: string }) {
  return (
    <p className="text-[10px] text-white/25 uppercase tracking-[0.15em] font-semibold px-3 mt-5 mb-1.5">{label}</p>
  );
}

function NavLink({ href, children, icon }: { href: string; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition font-medium"
    >
      {icon}
      {children}
    </Link>
  );
}
