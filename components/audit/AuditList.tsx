import { ACTION_LABELS } from "@/lib/audit";

export interface AuditRowView {
  id: string;
  at: string;
  actorName: string;
  actorRole: string;
  action: string;
  label: string;
  orgName?: string;
  meta?: unknown;
}

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Africa/Accra",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function roleChip(role: string) {
  const tone = role === "ADMIN" ? "bg-crimson/20 text-crimson" : role === "OWNER" ? "bg-accent/20 text-accent" : "bg-white/10 text-white/60";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${tone}`}>{role.toLowerCase()}</span>;
}

function actionChip(action: string) {
  const bad = action.endsWith(".delete") || action === "checkin.remove" || action === "recycle.empty";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${bad ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}>
      {ACTION_LABELS[action] ?? action}
    </span>
  );
}

export function AuditList({ rows, showOrg }: { rows: AuditRowView[]; showOrg?: boolean }) {
  if (rows.length === 0) {
    return <div className="card-glass rounded-2xl p-10 text-center text-sm text-white/40">Nothing has been recorded yet.</div>;
  }
  return (
    <>
      <div className="space-y-2.5 md:hidden">
        {rows.map((r) => (
          <div key={r.id} className="card-glass min-w-0 rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-2">
              {actionChip(r.action)}
              {roleChip(r.actorRole)}
            </div>
            <p className="mt-2 break-words text-sm text-white">{r.label}</p>
            <p className="mt-1 text-xs text-white/40">
              {r.actorName}
              {showOrg && r.orgName ? ` - ${r.orgName}` : ""} - {when(r.at)}
            </p>
          </div>
        ))}
      </div>

      <div className="card-glass hidden overflow-x-auto rounded-2xl md:block">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-white/5 text-left text-white/50">
            <tr>
              <th className="whitespace-nowrap px-4 py-3">When (Ghana time)</th>
              <th className="px-4 py-3">Who</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Details</th>
              {showOrg && <th className="px-4 py-3">Organizer</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/10 align-top">
                <td className="whitespace-nowrap px-4 py-3 text-white/60">{when(r.at)}</td>
                <td className="px-4 py-3">
                  <p className="text-white">{r.actorName}</p>
                  <div className="mt-1">{roleChip(r.actorRole)}</div>
                </td>
                <td className="px-4 py-3">{actionChip(r.action)}</td>
                <td className="px-4 py-3 text-white/80">{r.label}</td>
                {showOrg && <td className="px-4 py-3 text-white/60">{r.orgName ?? "-"}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
