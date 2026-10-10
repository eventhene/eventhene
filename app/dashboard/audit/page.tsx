import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserOrRedirect, resolveOrganizerAccess } from "@/lib/auth";
import { AuditList } from "@/components/audit/AuditList";

export const metadata = { title: "Activity log" };
export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const user = await requireUserOrRedirect("/dashboard/audit");
  const ctx = await resolveOrganizerAccess(user.id);
  if (!ctx) redirect("/dashboard");

  const logs = await db.orgAuditLog.findMany({
    where: { organizerId: ctx.organizer.id },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <p className="text-sm text-white/40">Security</p>
        <h1 className="h-section mt-1 text-white">Activity log</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/40">
          A permanent record of who deleted guests, removed check-ins, restored items or emptied the recycle bin for {ctx.organizer.displayName}. Entries cannot be edited or deleted.
        </p>
      </div>
      <AuditList
        rows={logs.map((l) => ({
          id: l.id,
          at: l.createdAt.toISOString(),
          actorName: l.actorName,
          actorRole: l.actorRole,
          action: l.action,
          label: l.label,
        }))}
      />
    </div>
  );
}
