import type { EventStatus } from "@prisma/client";

const MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "text-ink-muted" },
  PENDING_APPROVAL: { label: "In review", color: "text-sky" },
  EDITS_REQUESTED: { label: "Edits needed", color: "text-sky" },
  PUBLISHED: { label: "Live", color: "text-emerald" },
  REJECTED: { label: "Rejected", color: "text-crimson" },
  PAUSED: { label: "Paused", color: "text-ink-muted" },
  ENDED: { label: "Ended", color: "text-ink-muted" },
  CANCELLED: { label: "Cancelled", color: "text-crimson" },
};

export function StatusChip({ status }: { status: EventStatus | string }) {
  const m = MAP[status] || { label: String(status), color: "text-ink-muted" };
  return (
    <span className={`status-dot ${m.color}`}>
      {m.label}
    </span>
  );
}
