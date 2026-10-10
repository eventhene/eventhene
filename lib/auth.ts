// Public auth helpers used across the app.
// Replaces the previous Clerk-based module. No external auth provider.

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "./db";
import type { User, UserRole } from "@prisma/client";
import { readSession, readSessionFromRequest, destroySession } from "./auth/session";
import { hashPassword, verifyPassword, validatePasswordStrength } from "./auth/password";

type ReqWithCookies = {
  cookies: { get(name: string): { value: string } | undefined };
  headers: { get(name: string): string | null };
};

export class ForbiddenError extends Error {
  constructor(msg = "Forbidden") {
    super(msg);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends Error {
  constructor(msg = "Unauthorized") {
    super(msg);
    this.name = "UnauthorizedError";
  }
}

/** Returns the current signed-in user, or null. */
export async function getCurrentUser(req?: ReqWithCookies): Promise<User | null> {
  let sess = await readSession();
  if (!sess && req) sess = await readSessionFromRequest(req);
  if (!sess) return null;

  const bootstrapAdmins = getBootstrapAdminEmails();
  if (
    bootstrapAdmins.includes(sess.user.email.toLowerCase()) &&
    sess.user.role !== "SUPER_ADMIN"
  ) {
    return db.user.update({
      where: { id: sess.user.id },
      data: { role: "SUPER_ADMIN" },
    });
  }
  return sess.user;
}

export async function requireUser(req?: ReqWithCookies): Promise<User> {
  const user = await getCurrentUser(req);
  if (!user) throw new UnauthorizedError();
  return user;
}

/** Redirects to /sign-in if not authenticated. For server components. */
export async function requireUserOrRedirect(returnTo?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    const target = returnTo ? `/sign-in?next=${encodeURIComponent(returnTo)}` : "/sign-in";
    redirect(target);
  }
  return user;
}

export async function requireRole(role: UserRole | UserRole[], req?: ReqWithCookies): Promise<User> {
  const user = await requireUser(req);
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(user.role)) throw new ForbiddenError();
  return user;
}

export type OrganizerAccess = "OWNER" | "MANAGER";
export const ORG_COOKIE = "eh_org";

/** Every organizer a user can work in: their own (owner) plus any they manage. Own comes first. */
export async function listAccessibleOrganizers(userId: string) {
  const own = await db.organizer.findUnique({ where: { userId } });
  const memberships = await db.teamMember.findMany({
    where: { userId, role: "MANAGER" },
    include: { organizer: true },
    orderBy: { createdAt: "asc" },
  });
  const list: Array<{ organizer: NonNullable<typeof own>; access: OrganizerAccess }> = [];
  if (own) list.push({ organizer: own, access: "OWNER" });
  for (const m of memberships) {
    if (!own || m.organizerId !== own.id) list.push({ organizer: m.organizer, access: "MANAGER" });
  }
  return list;
}

function preferredOrganizerId(req?: ReqWithCookies): string | undefined {
  try {
    const fromReq = req?.cookies.get(ORG_COOKIE)?.value;
    if (fromReq) return fromReq;
  } catch {}
  try {
    return cookies().get(ORG_COOKIE)?.value;
  } catch {
    return undefined;
  }
}

/** The organizer the user is currently working in (their pick from the switcher, else their own). */
export async function resolveOrganizerAccess(userId: string, req?: ReqWithCookies) {
  const all = await listAccessibleOrganizers(userId);
  if (all.length === 0) return null;
  const wanted = preferredOrganizerId(req);
  return (wanted && all.find((a) => a.organizer.id === wanted)) || all[0];
}

export async function requireOrganizer(req?: ReqWithCookies) {
  const user = await requireUser(req);
  const resolved = await resolveOrganizerAccess(user.id, req);
  if (!resolved) throw new ForbiddenError("No organizer profile");
  if (resolved.organizer.isSuspended) throw new ForbiddenError("Organizer account is suspended");
  return { user, organizer: resolved.organizer, access: resolved.access };
}

/** Owner-only actions (payout details, team management). Managers are rejected. */
export async function requireOrganizerOwner(req?: ReqWithCookies) {
  const ctx = await requireOrganizer(req);
  if (ctx.access !== "OWNER") throw new ForbiddenError("Only the account owner can do this");
  return ctx;
}

export async function requireEventOwner(eventId: string, req?: ReqWithCookies) {
  const user = await requireUser(req);
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { organizer: true },
  });
  if (!event) throw new ForbiddenError("Event not found");
  const isOwner = event.organizer.userId === user.id;
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  if (!isOwner && !isAdmin) {
    const manager = await db.teamMember.findUnique({
      where: { organizerId_userId: { organizerId: event.organizerId, userId: user.id } },
    });
    if (!manager || manager.role !== "MANAGER") throw new ForbiddenError();
  }
  return { user, event };
}

export async function requireScannerForEvent(eventId: string, req?: ReqWithCookies) {
  const user = await requireUser(req);
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    const event = await db.event.findUniqueOrThrow({ where: { id: eventId } });
    return { user, event };
  }
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { organizer: true },
  });
  if (!event) throw new ForbiddenError("Event not found");
  if (event.organizer.userId === user.id) return { user, event };
  const staffEntry = await db.eventStaff.findUnique({
    where: { eventId_userId: { eventId, userId: user.id } },
  });
  if (staffEntry) return { user, event };

  const member = await db.teamMember.findUnique({
    where: { organizerId_userId: { organizerId: event.organizerId, userId: user.id } },
  });
  if (member && (member.role === "MANAGER" || member.eventIds.length === 0 || member.eventIds.includes(eventId))) {
    return { user, event };
  }
  throw new ForbiddenError("Not authorized to scan this event");
}

export function isAdmin(role: UserRole | undefined | null): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

function getBootstrapAdminEmails(): string[] {
  const raw = process.env.BOOTSTRAP_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// --------------------------------------------------
// Account actions (used by sign-in / sign-up routes)
// --------------------------------------------------

export async function signUpUser(input: {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  country?: string;
  currency?: string;
  timezone?: string;
}) {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }
  const strength = validatePasswordStrength(input.password);
  if (!strength.ok) throw new Error(strength.reason!);

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new Error("An account with this email already exists. Try signing in.");

  const passwordHash = await hashPassword(input.password);
  const bootstrapAdmins = getBootstrapAdminEmails();
  const role: UserRole = bootstrapAdmins.includes(email) ? "SUPER_ADMIN" : "ATTENDEE";

  const phone = input.phone?.trim() || null;
  if (phone) {
    const existingPhone = await db.user.findUnique({ where: { phone } });
    if (existingPhone) throw new Error("This phone number is already registered.");
  }

  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      fullName: input.fullName?.trim() || null,
      phone,
      country: input.country,
      currency: input.currency,
      timezone: input.timezone,
      role,
    },
  });

  return { user };
}

export async function signInUser(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new Error("No account with that email. Try signing up.");

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw new Error("Incorrect password.");

  return { user };
}

export async function signOutUser(): Promise<void> {
  await destroySession();
}
