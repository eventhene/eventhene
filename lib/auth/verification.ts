import { db } from "@/lib/db";

/** Marks the account's phone as verified, and mirrors it onto the organizer profile if there is one. */
export async function markPhoneVerified(userId: string): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { phoneVerified: true } });
  await db.organizer.updateMany({ where: { userId }, data: { phoneVerified: true } });
}

export async function markEmailVerified(userId: string): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { emailVerified: true } });
}

/** Called when someone changes their phone number: the new number starts unverified. */
export async function resetPhoneVerified(userId: string): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { phoneVerified: false } });
  await db.organizer.updateMany({ where: { userId }, data: { phoneVerified: false } });
}
