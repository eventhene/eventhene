import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserOrRedirect, isAdmin } from "@/lib/auth";
import { AuditList } from "@/components/audit/AuditList";

export const metadata = { title: "Audit trail" };
export const dynamic = "force-dynamic";

export default async function AdminAuditPage({ searchParams }: { searchParams: { org?: string } }) {
  const user = await requireUserOrRedirect("/superadmin/audit");
  if (!isAdmin(user.role)) redirect("/dashboard");

  const [logs, organizers] = await Promise.all([
    db.orgAuditLog.findMany({
      where: searchParams.org ? { organizerId: searchParams.org } : undefined,
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    db.organizer.findMany({ select: { id: true, displayName: true }, orderBy: { displayName: "asc" } }),
  ]);
  const names = new Map(organizers.map((o) => [o.id, o.displayName]));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-white/40">Admin</p>
        <h1 className="h-section mt-1 text-white">Audit trail</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/40">
          Every guest deletion, check-in removal, restore and bin-emptying across all organizers, with who did it and when. Organizers can see only their own entries.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/superadmin/audit" className={`chip ${!searchParams.org ? "chip-ink" : "chip-outline"}`}>All organizers</Link>
        {organizers.map((o) => (
          <Link key={o.id} href={`/superadmin/audit?org=${o.id}`} className={`chip ${searchParams.org === o.id ? "chip-ink" : "chip-outline"}`}>
            {o.displayName}
          </Link>
        ))}
      </div>

      <AuditList
        showOrg
        rows={logs.map((l) => ({
          id: l.id,
          at: l.createdAt.toISOString(),
          actorName: l.actorName,
          actorRole: l.actorRole,
          action: l.action,
          label: l.label,
          orgName: names.get(l.organizerId) ?? "Deleted organizer",
        }))}
      />
    </div>
  );
}
