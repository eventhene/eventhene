import { auth, currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import type { UserRole } from "@prisma/client";

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

/**
 * Get the current DB user (synced from Clerk).
 * Returns null if not signed in.
 */
export async function getCurrentUser() {
  const { userId } = auth();
  if (!userId) return null;
  let user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    // Lazy-sync user from Clerk if webhook hasn't fired yet
    const clerkUser = await clerkCurrentUser();
    if (!clerkUser) return null;
    user = await db.user.create({
      data: {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? `${clerkUser.id}@noemail.local`,
        fullName: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null,
        imageUrl: clerkUser.imageUrl
      }
    });
  }
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireRole(role: UserRole | UserRole[]) {
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
    include: { organizer: true }
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
    include: { organizer: true }
  });
  if (!event) throw new ForbiddenError("Event not found");
  if (event.organizer.userId === user.id) return { user, event };
  const staffEntry = await db.eventStaff.findUnique({
    where: { eventId_userId: { eventId, userId: user.id } }
  });
  if (!staffEntry) throw new ForbiddenError("Not authorized to scan this event");
  return { user, event };
}

export function isAdmin(role: UserRole | undefined | null): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}
