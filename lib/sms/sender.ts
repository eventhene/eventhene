import { db } from "@/lib/db";
import { getPlatformSenderId } from "./hubtel";

/** Hubtel allows alphanumeric 1-11 chars for Sender ID. */
export function sanitizeSenderId(raw: string): string {
  return (raw || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 11);
}

export function validateSenderIdFormat(raw: string): { ok: boolean; reason?: string } {
  const cleaned = sanitizeSenderId(raw);
  if (cleaned.length < 3) return { ok: false, reason: "Sender ID must be at least 3 letters or numbers." };
  if (cleaned.length > 11) return { ok: false, reason: "Sender ID must be 11 characters or fewer." };
  if (!/^[A-Za-z0-9]+$/.test(cleaned)) return { ok: false, reason: "Only letters and digits are allowed." };
  if (!/[A-Za-z]/.test(cleaned)) return { ok: false, reason: "Sender ID should contain at least one letter." };
  return { ok: true };
}

/**
 * Resolve the Sender ID to use when sending for this organizer.
 * Returns the organizer's custom Sender ID only when its status is APPROVED.
 * Otherwise returns the platform default (EventHene).
 */
export async function resolveSenderId(organizerId: string): Promise<string> {
  const org = await db.organizer.findUnique({
    where: { id: organizerId },
    select: { senderId: true, senderIdStatus: true },
  });
  if (
    org?.senderIdStatus === "APPROVED" &&
    org.senderId &&
    org.senderId.length > 0
  ) {
    return sanitizeSenderId(org.senderId);
  }
  return getPlatformSenderId();
}
