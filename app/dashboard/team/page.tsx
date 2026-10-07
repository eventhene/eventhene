import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserOrRedirect, resolveOrganizerAccess } from "@/lib/auth";
import { TeamManager } from "@/components/dashboard/TeamManager";

export const metadata = { title: "Team" };
export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await requireUserOrRedirect("/dashboard/team");
  const ctx = await resolveOrganizerAccess(user.id);
  if (!ctx || ctx.access !== "OWNER") redirect("/dashboard");
  const organizer = ctx.organizer;

  const [members, invites, events] = await Promise.all([
    db.teamMember.findMany({
      where: { organizerId: organizer.id },
      include: { user: { select: { fullName: true, email: true, phone: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.teamInvite.findMany({
      where: { organizerId: organizer.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    db.event.findMany({
      where: { organizerId: organizer.id },
      orderBy: { startsAt: "desc" },
      select: { id: true, title: true },
      take: 100,
    }),
  ]);

  const eventTitle = new Map(events.map((e) => [e.id, e.title]));

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <p className="text-sm text-white/40">Your people</p>
        <h1 className="h-section mt-1 text-white">Team</h1>
        <p className="text-white/40 mt-2 max-w-2xl">
          Invite people by SMS to help run your events. Managers can run events and send SMS. Scanners can only check tickets in at the gate.
        </p>
      </div>

      <TeamManager
        events={events}
        members={members.map((m) => ({
          id: m.id,
          name: m.user.fullName || m.user.email,
          email: m.user.email,
          phone: m.user.phone,
          role: m.role,
          scope:
            m.role === "MANAGER"
              ? "Everything except payouts and team"
              : m.eventIds.length === 0
              ? "All events"
              : m.eventIds.map((id) => eventTitle.get(id) ?? "Removed event").join(", "),
        }))}
        invites={invites.map((i) => ({
          id: i.id,
          phone: i.phone,
          role: i.role,
          expiresAt: i.expiresAt.toISOString(),
          scope:
            i.role === "MANAGER"
              ? "Manager"
              : i.eventIds.length === 0
              ? "Scanner, all events"
              : `Scanner, ${i.eventIds.length} event${i.eventIds.length > 1 ? "s" : ""}`,
        }))}
      />
    </div>
  );
}
