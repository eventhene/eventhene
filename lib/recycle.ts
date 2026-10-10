import { db } from "@/lib/db";
import { requireUser, ForbiddenError } from "@/lib/auth";
import { actorFor, logAudit, type Actor } from "@/lib/audit";

export type DeletedKind = "guest" | "contact" | "contact_list" | "team_member";

type Req = { cookies: { get(name: string): { value: string } | undefined }; headers: { get(name: string): string | null } };

/** Anyone who can work in this organizer (owner, team manager) or a platform admin may use its bin. */
export async function requireBinAccess(organizerId: string, req?: Req) {
  const user = await requireUser(req);
  const organizer = await db.organizer.findUnique({ where: { id: organizerId } });
  if (!organizer) throw new ForbiddenError("Organizer not found");
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  if (!isAdmin && organizer.userId !== user.id) {
    const m = await db.teamMember.findUnique({ where: { organizerId_userId: { organizerId, userId: user.id } } });
    if (!m || m.role !== "MANAGER") throw new ForbiddenError();
  }
  return { user, organizer, actor: actorFor(user, organizer.userId) };
}

/** Save a snapshot BEFORE deleting. Best-effort: a failure here must never block the delete. */
export async function snapshotDeleted(input: {
  organizerId: string;
  eventId?: string | null;
  kind: DeletedKind;
  recordId: string;
  label: string;
  snapshot: unknown;
  actor: Actor;
}): Promise<string | null> {
  try {
    const row = await db.deletedRecord.create({
      data: {
        organizerId: input.organizerId,
        eventId: input.eventId ?? null,
        kind: input.kind,
        recordId: input.recordId,
        label: input.label.slice(0, 200),
        snapshot: JSON.parse(JSON.stringify(input.snapshot)),
        actorId: input.actor.id ?? null,
        actorName: input.actor.name,
      },
    });
    return row.id;
  } catch (e) {
    console.error("[recycle] snapshot failed (delete continues)", e);
    return null;
  }
}

export async function listBin(organizerId: string) {
  try {
    const rows = await db.deletedRecord.findMany({
      where: { organizerId, restored: false },
      orderBy: { createdAt: "desc" },
      take: 300,
      select: { id: true, kind: true, label: true, actorName: true, createdAt: true, eventId: true },
    });
    return rows;
  } catch {
    return []; // table missing (migration not run) must not break the page
  }
}

export async function emptyBin(organizerId: string, actor: Actor): Promise<number> {
  const res = await db.deletedRecord.deleteMany({ where: { organizerId, restored: false } });
  await logAudit({
    organizerId,
    actor,
    action: "recycle.empty",
    targetType: "recycle_bin",
    label: `Emptied the recycle bin (${res.count} item${res.count === 1 ? "" : "s"} can no longer be restored)`,
    meta: { removed: res.count },
  });
  return res.count;
}

const DATE_KEYS = ["createdAt", "updatedAt", "issuedAt", "usedAt", "paidAt", "welcomedAt"];

function revive<T extends Record<string, any>>(row: T): T {
  const out: Record<string, any> = { ...row };
  for (const k of DATE_KEYS) if (typeof out[k] === "string") out[k] = new Date(out[k]);
  return out as T;
}

export interface RestoreResult {
  ok: boolean;
  reason?: string;
  note?: string;
}

export async function restoreRecord(id: string, organizerId: string, actor: Actor): Promise<RestoreResult> {
  const rec = await db.deletedRecord.findUnique({ where: { id } });
  if (!rec || rec.organizerId !== organizerId) return { ok: false, reason: "That item is no longer in the bin." };
  if (rec.restored) return { ok: false, reason: "That item was already restored." };

  const snap = rec.snapshot as any;
  let result: RestoreResult;
  try {
    if (rec.kind === "guest") result = await restoreGuest(snap);
    else if (rec.kind === "contact") result = await restoreContact(snap, organizerId);
    else if (rec.kind === "contact_list") result = await restoreContactList(snap, organizerId);
    else if (rec.kind === "team_member") result = await restoreTeamMember(snap, organizerId);
    else result = { ok: false, reason: "Unknown item type." };
  } catch (e: any) {
    console.error("[recycle] restore failed", e);
    return { ok: false, reason: "Could not restore this item. Nothing was changed." };
  }

  if (result.ok) {
    // idempotent: only the first restore flips the flag
    const flipped = await db.deletedRecord.updateMany({ where: { id, restored: false }, data: { restored: true, restoredAt: new Date() } });
    if (flipped.count === 0) return { ok: false, reason: "That item was already restored." };
    await logAudit({
      organizerId,
      eventId: rec.eventId,
      actor,
      action: `${rec.kind}.restore`,
      targetType: rec.kind,
      targetId: rec.recordId,
      label: `Restored ${rec.label}`,
      meta: result.note ? { note: result.note } : undefined,
    });
  }
  return result;
}

/* ---------------- per-kind restore (defensive) ---------------- */

async function restoreGuest(snap: any): Promise<RestoreResult> {
  const t = revive(snap.ticket);
  const a = snap.attendee ? revive(snap.attendee) : null;

  const [type, event] = await Promise.all([
    db.ticketType.findUnique({ where: { id: t.ticketTypeId } }),
    db.event.findUnique({ where: { id: t.eventId }, select: { id: true } }),
  ]);
  if (!event) return { ok: false, reason: "The event this guest belonged to no longer exists." };
  if (!type) return { ok: false, reason: "The ticket category for this guest no longer exists." };

  if (await db.ticket.findUnique({ where: { id: t.id }, select: { id: true } })) return { ok: false, reason: "This guest is already on the list." };
  const clash = await db.ticket.findFirst({
    where: { OR: [{ visibleRef: t.visibleRef }, { qrToken: t.qrToken }, { qrTokenHash: t.qrTokenHash }] },
    select: { id: true },
  });
  if (clash) return { ok: false, reason: "A ticket with the same reference already exists, so this one cannot be restored." };

  let note: string | undefined;
  await db.$transaction(async (tx) => {
    if (a && !(await tx.attendee.findUnique({ where: { id: a.id }, select: { id: true } }))) {
      await tx.attendee.create({ data: { ...a, customAnswers: a.customAnswers ?? {} } });
    }
    const attendeeId = a?.id ?? t.attendeeId;
    const order = t.orderId ? await tx.order.findUnique({ where: { id: t.orderId }, select: { id: true } }) : null;
    await tx.ticket.create({ data: { ...t, attendeeId, orderId: order ? t.orderId : null } });
    const fresh = await tx.ticketType.update({ where: { id: type.id }, data: { sold: { increment: 1 } } });
    if (fresh.sold > fresh.quantity) note = "The category is now over its limit.";
  });
  return { ok: true, note };
}

async function restoreContact(snap: any, organizerId: string): Promise<RestoreResult> {
  const c = revive(snap.contact);
  const list = await db.contactList.findUnique({ where: { id: c.listId } });
  if (!list || list.organizerId !== organizerId) return { ok: false, reason: "The contact list this belonged to no longer exists." };
  const dup = await db.contact.findFirst({ where: { listId: c.listId, phone: c.phone }, select: { id: true } });
  if (dup) return { ok: false, reason: "That phone number is already in the list." };
  if (await db.contact.findUnique({ where: { id: c.id }, select: { id: true } })) return { ok: false, reason: "This contact is already back." };
  await db.contact.create({ data: c });
  return { ok: true };
}

async function restoreContactList(snap: any, organizerId: string): Promise<RestoreResult> {
  const l = revive(snap.list);
  const contacts: any[] = (snap.contacts ?? []).map(revive);
  if (await db.contactList.findUnique({ where: { id: l.id }, select: { id: true } })) return { ok: false, reason: "This list is already back." };
  const clash = await db.contactList.findFirst({ where: { organizerId, name: l.name }, select: { id: true } });
  if (clash) return { ok: false, reason: `You already have a list named "${l.name}". Rename or delete it first.` };
  await db.$transaction(async (tx) => {
    await tx.contactList.create({ data: { ...l, organizerId } });
    if (contacts.length) await tx.contact.createMany({ data: contacts, skipDuplicates: true });
  });
  return { ok: true, note: `${contacts.length} contact${contacts.length === 1 ? "" : "s"} restored with the list.` };
}

async function restoreTeamMember(snap: any, organizerId: string): Promise<RestoreResult> {
  const m = revive(snap.member);
  const user = await db.user.findUnique({ where: { id: m.userId }, select: { id: true } });
  if (!user) return { ok: false, reason: "That person's account no longer exists." };
  const existing = await db.teamMember.findUnique({ where: { organizerId_userId: { organizerId, userId: m.userId } } });
  if (existing) return { ok: false, reason: "That person is already on your team." };
  // Scanner access was limited to specific events: only keep the ones that still exist.
  let eventIds: string[] = m.eventIds ?? [];
  if (eventIds.length) {
    const alive = await db.event.findMany({ where: { id: { in: eventIds }, organizerId }, select: { id: true } });
    eventIds = alive.map((e) => e.id);
  }
  await db.teamMember.create({ data: { ...m, organizerId, eventIds } });
  return { ok: true };
}
