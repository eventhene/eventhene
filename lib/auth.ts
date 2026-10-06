// Public auth helpers used across the app.
// Replaces the previous Clerk-based module. No external auth provider.

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "./db";
import type { User, UserRole } from "@prisma/client";
import { readSession, createSession, destroySession } from "./auth/session";
import { hashPassword, verifyPassword, validatePasswordStrength } from "./auth/password";

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
export async function getCurrentUser(): Promise<User | null> {
  const sess = await readSession();
  if (!sess) return null;

  // Auto-promote bootstrap admins (owner emails from env).
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

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
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

export async function requireRole(role: UserRole | UserRole[]): Promise<User> {
  const user = await requireUser();
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(user.role)) throw new ForbiddenError();
  return user;
}

export async function requireOrganizer() {
  const user = await requireUser();
  const organizer = await db.organizer.findUnique({ where: { userId: user.id } });
  if (!organizer) throw new ForbiddenError("No organizer profile");
  if (organizer.isSuspended) throw new ForbiddenError("Organizer account is suspended");
  return { user, organizer };
}

export async function requireEventOwner(eventId: string) {
  const user = await requireUser();
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { organizer: true },
  });
  if (!event) throw new ForbiddenError("Event not found");
  const isOwner = event.organizer.userId === user.id;
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  if (!isOwner && !isAdmin) throw new ForbiddenError();
  return { user, event };
}

export async function requireScannerForEvent(eventId: string) {
  const user = await requireUser();
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
  if (!staffEntry) throw new ForbiddenError("Not authorized to scan this event");
  return { user, event };
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

  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      fullName: input.fullName?.trim() || null,
      country: input.country,
      currency: input.currency,
      timezone: input.timezone,
      role,
    },
  });

  const sessionInfo = await createSessionFromRequest(user.id);
  return { user, sessionInfo };
}

export async function signInUser(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new Error("No account with that email. Try signing up.");

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw new Error("Incorrect password.");

  const sessionInfo = await createSessionFromRequest(user.id);
  return { user, sessionInfo };
}

export async function signOutUser(): Promise<void> {
  await destroySession();
}

async function createSessionFromRequest(userId: string) {
  const h = headers();
  return createSession(userId, {
    ip: h.get("x-forwarded-for") ?? undefined,
    userAgent: h.get("user-agent") ?? undefined,
  });
}
