import type { EventStatus } from "@prisma/client";

const MAP: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "chip-outline" },
  PENDING_APPROVAL: { label: "In review", cls: "chip-sky" },
  EDITS_REQUESTED: { label: "Edits needed", cls: "chip-sky" },
  PUBLISHED: { label: "Live", cls: "chip-emerald" },
  REJECTED: { label: "Rejected", cls: "chip-crimson" },
  PAUSED: { label: "Paused", cls: "chip-outline" },
  ENDED: { label: "Ended", cls: "chip-outline" },
  CANCELLED: { label: "Cancelled", cls: "chip-crimson" },
};

export function StatusChip({ status }: { status: EventStatus | string }) {
  const m = MAP[status] || { label: String(status), cls: "chip-outline" };
  return <span className={m.cls}>{m.label}</span>;
}
