import { db } from "@/lib/db";
import type { User } from "@prisma/client";

export type AuditRole = "OWNER" | "MANAGER" | "ADMIN";

export interface Actor {
  id?: string;
  name: string;
  role: AuditRole;
}

/** Works out who is acting, relative to an organizer: platform admin, the owner, or a team manager. */
export function actorFor(user: User, organizerOwnerUserId: string): Actor {
  const name = user.fullName?.trim() || user.email;
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") return { id: user.id, name, role: "ADMIN" };
  if (user.id === organizerOwnerUserId) return { id: user.id, name, role: "OWNER" };
  return { id: user.id, name, role: "MANAGER" };
}

export interface AuditInput {
  organizerId: string;
  eventId?: string | null;
  actor: Actor;
  action: string; // guest.delete | guest.restore | checkin.remove | recycle.empty | contact.delete ...
  targetType: string;
  targetId?: string | null;
  label: string;
  meta?: Record<string, unknown>;
}

/** Best-effort: an audit write must never block or break the action it describes. */
export async function logAudit(input: AuditInput): Promise<void> {
  try {
    await db.orgAuditLog.create({
      data: {
        organizerId: input.organizerId,
        eventId: input.eventId ?? null,
        actorId: input.actor.id ?? null,
        actorName: input.actor.name,
        actorRole: input.actor.role,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        label: input.label,
        meta: (input.meta ?? undefined) as any,
      },
    });
  } catch (e) {
    console.error("[audit] could not write audit entry", e);
  }
}

export const ACTION_LABELS: Record<string, string> = {
  "guest.delete": "Deleted a guest",
  "guest.restore": "Restored a guest",
  "checkin.remove": "Removed a check-in",
  "contact.delete": "Deleted an SMS contact",
  "contact.restore": "Restored an SMS contact",
  "contact_list.delete": "Deleted a contact list",
  "contact_list.restore": "Restored a contact list",
  "team_member.delete": "Removed a team member",
  "team_member.restore": "Restored a team member",
  "recycle.empty": "Emptied the recycle bin",
};
