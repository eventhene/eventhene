import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { requireUserOrRedirect, resolveOrganizerAccess, listAccessibleOrganizers, isAdmin } from "@/lib/auth";
import { OrgSwitcher } from "@/components/dashboard/OrgSwitcher";
import { MobileMoreMenu } from "@/components/dashboard/MobileMoreMenu";
import { RecycleBin } from "@/components/recycle/RecycleBin";
import { Logo } from "@/components/Logo";
import { SignOutButton } from "@/components/SignOutButton";
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  MessageSquare,
  ScanLine,
  Users,
  UserPlus,
  Briefcase,
  Settings,
  Shield,
  ArrowLeft,
  ScrollText,
} from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserOrRedirect("/dashboard");
  const resolved = await resolveOrganizerAccess(user.id);

  let organizer = resolved?.organizer ?? null;
  let access: "OWNER" | "MANAGER" | "ADMIN" = resolved?.access ?? "OWNER";

  // An event page always works in that event's organizer, whichever one you were last in.
  const path = headers().get("x-pathname") || "";
  const eventMatch = path.match(/^\/dashboard\/events\/([^/]+)/);
  if (eventMatch && eventMatch[1] !== "new") {
    const event = await db.event.findUnique({ where: { id: eventMatch[1] }, include: { organizer: true } });
    if (event && event.organizerId !== organizer?.id) {
      if (isAdmin(user.role)) {
        organizer = event.organizer;
        access = "ADMIN";
      } else {
        const mine = (await listAccessibleOrganizers(user.id)).find((a) => a.organizer.id === event.organizerId);
        if (mine) {
          organizer = mine.organizer;
          access = mine.access;
        }
      }
    }
  }

  if (!organizer) {
    // Admins can step into any organizer's event from the admin panel.
    if (isAdmin(user.role)) {
      if (!organizer) redirect("/superadmin");
    } else {
      // Scanner-only team members and event staff go straight to the scanner.
      const scannerAccess =
        (await db.teamMember.count({ where: { userId: user.id } })) > 0 ||
        (await db.eventStaff.count({ where: { userId: user.id } })) > 0;
      redirect(scannerAccess ? "/scan" : "/onboarding");
    }
  }

  const org = organizer!;
  const accessible = access === "ADMIN" ? [] : await listAccessibleOrganizers(user.id);
  const switcherOrgs = accessible.map((a) => ({ id: a.organizer.id, name: a.organizer.displayName, access: a.access }));
  const isOwner = access === "OWNER";
  const isAdminView = access === "ADMIN";

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <aside className="fixed left-0 top-0 h-screen w-[260px] hidden md:flex flex-col">
        <div className="m-3 flex-1 flex flex-col rounded-2xl card-glass p-5 overflow-y-auto">
          <Logo variant="icon" size="md" />
          {switcherOrgs.length > 1 && (
            <div className="mt-4">
              <OrgSwitcher currentId={org.id} orgs={switcherOrgs} />
            </div>
          )}

          {isAdminView ? (
            <div className="mt-6 flex-1 flex flex-col gap-0.5">
              <div className="rounded-xl border border-crimson/30 bg-crimson/10 p-3 mb-3">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-crimson">
                  <Shield className="w-3.5 h-3.5" />
                  Admin view
                </p>
                <p className="text-xs text-white/60 mt-1">
                  You are managing an event for <strong className="text-white">{org.displayName}</strong>.
                </p>
              </div>
              <NavLink href="/superadmin/events" icon={<ArrowLeft className="w-[18px] h-[18px]" />}>Back to all events</NavLink>
              <NavLink href="/superadmin" icon={<Shield className="w-[18px] h-[18px]" />}>Admin overview</NavLink>
            </div>
          ) : (
            <div className="mt-8 flex-1 flex flex-col gap-0.5">
              <SideSection label="Menu" />
              <NavLink href="/dashboard" icon={<LayoutDashboard className="w-[18px] h-[18px]" />}>Overview</NavLink>
              <NavLink href="/dashboard/events" icon={<CalendarDays className="w-[18px] h-[18px]" />}>Events</NavLink>
              <NavLink href="/dashboard/events/new" icon={<PlusCircle className="w-[18px] h-[18px]" />} accent>Create event</NavLink>

              <SideSection label="Tools" />
              <NavLink href="/dashboard/sms" icon={<MessageSquare className="w-[18px] h-[18px]" />}>SMS</NavLink>
              <NavLink href="/scan" icon={<ScanLine className="w-[18px] h-[18px]" />}>Scanner</NavLink>
              {isOwner && (
                <NavLink href="/dashboard/team" icon={<Users className="w-[18px] h-[18px]" />}>Team</NavLink>
              )}
              <NavLink href="/dashboard/services" icon={<Briefcase className="w-[18px] h-[18px]" />}>Services</NavLink>
              <NavLink href="/dashboard/audit" icon={<ScrollText className="w-[18px] h-[18px]" />}>Activity log</NavLink>

              <SideSection label="Account" />
              {isOwner && (
                <NavLink href="/dashboard/settings" icon={<Settings className="w-[18px] h-[18px]" />}>Settings</NavLink>
              )}
              <SignOutButton className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition font-medium w-full text-left" />
            </div>
          )}

          <div className="mt-4 rounded-xl bg-white/5 border border-white/8 p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                {org.displayName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{org.displayName}</p>
                <p className="text-[11px] text-white/40 truncate">
                  {isAdminView ? "Admin access" : isOwner ? user.email : `Manager - ${user.email}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <header className="md:hidden sticky top-0 z-30 glass-dark px-4 py-3 flex items-center justify-between">
        <Logo variant="icon" size="md" />
        {switcherOrgs.length > 1 && (
          <div className="flex-1 mx-3 max-w-[220px]">
            <OrgSwitcher currentId={org.id} orgs={switcherOrgs} compact />
          </div>
        )}
        {isAdminView ? (
          <Link href="/superadmin/events" className="text-xs text-white/60 font-semibold">Back to admin</Link>
        ) : (
          <SignOutButton className="text-xs text-white/40 font-semibold hover:text-white/60 transition" showIcon={false} />
        )}
      </header>

      <main className="md:ml-[260px] p-5 md:p-10 pb-24 md:pb-10 max-w-6xl">
        {isOwner && !user.phoneVerified && (
          <Link
            href="/dashboard/settings#verification"
            className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm hover:bg-amber-500/10 transition"
          >
            <span className="text-white/80">
              <strong className="text-amber-400">Verify your phone number</strong> to secure your account and payouts.
            </span>
            <span className="text-xs font-semibold text-accent shrink-0">Verify now</span>
          </Link>
        )}
        {isAdminView && (
          <div className="md:hidden mb-4 rounded-xl border border-crimson/30 bg-crimson/10 p-3 text-xs text-white/70">
            <strong className="text-crimson">Admin view:</strong> managing an event for {org.displayName}.
          </div>
        )}
        {children}
      </main>

      <RecycleBin scopeId={org.id} />

      {!isAdminView && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 glass-dark grid grid-cols-5 py-2 z-30">
          <MobileTab href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Home" />
          <MobileTab href="/dashboard/events" icon={<CalendarDays className="w-4 h-4" />} label="Events" />
          <MobileTab href="/dashboard/sms" icon={<MessageSquare className="w-4 h-4" />} label="SMS" />
          <MobileTab href="/scan" icon={<ScanLine className="w-4 h-4" />} label="Scan" />
          <MobileMoreMenu isOwner={isOwner} />
        </nav>
      )}
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
