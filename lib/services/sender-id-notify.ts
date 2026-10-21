import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import { isPlaceholderEmail } from "@/lib/guest-email";
import {
  sendEmail,
  senderIdRequestedEmail,
  senderIdApprovedEmail,
  senderIdRejectedEmail,
} from "@/lib/email";
import { sendSMS } from "@/lib/sms/hubtel";

/**
 * Sender ID notifications.
 *
 * A request used to land silently: the row flipped to PENDING and nothing told
 * anyone, so one sat unnoticed for two days. Now the platform admins hear about
 * it, and the organizer hears back when it is decided.
 *
 * Every send is best-effort. None of this may block or fail the request or the
 * approval it describes.
 */

/** Admins who should hear about platform events. Phone only if they verified one. */
async function platformAdmins() {
  return db.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    select: { id: true, email: true, phone: true, phoneVerified: true, fullName: true },
  });
}

function usableEmail(email?: string | null): string | null {
  if (!email || isPlaceholderEmail(email)) return null;
  return email;
}

/** Tells every platform admin that a Sender ID is waiting on them. */
export async function notifySenderIdRequested(opts: {
  organizerId: string;
  organizerName: string;
  senderId: string;
  requestedBy: string;
}): Promise<void> {
  try {
    const admins = await platformAdmins();
    if (admins.length === 0) {
      console.warn("[sender-id] no platform admin to notify about", opts.senderId);
      return;
    }

    const adminUrl = `${getAppUrl()}/superadmin/sms`;
    const sms = `EventHene: ${opts.organizerName} requested Sender ID "${opts.senderId}". Approve or reject it in the admin dashboard.`;

    await Promise.allSettled(
      admins.flatMap((a) => {
        const jobs: Promise<unknown>[] = [];
        const to = usableEmail(a.email);
        if (to) {
          jobs.push(
            sendEmail({
              to,
              subject: `Sender ID request: ${opts.senderId} (${opts.organizerName})`,
              html: senderIdRequestedEmail({
                organizer: opts.organizerName,
                senderId: opts.senderId,
                requestedBy: opts.requestedBy,
                adminUrl,
              }),
            })
          );
        }
        // Admin alerts are platform cost, never an organizer's credits.
        if (a.phone && a.phoneVerified) jobs.push(sendSMS(a.phone, sms));
        return jobs;
      })
    );
  } catch (e) {
    console.error("[sender-id] request notification failed", e);
  }
}

/** Tells the organizer their Sender ID was approved or turned down. */
export async function notifySenderIdDecided(opts: {
  organizerId: string;
  senderId: string;
  approved: boolean;
  note?: string | null;
}): Promise<void> {
  try {
    const org = await db.organizer.findUnique({
      where: { id: opts.organizerId },
      include: { user: { select: { email: true, phone: true } } },
    });
    if (!org) return;

    const smsUrl = `${getAppUrl()}/dashboard/sms`;
    const reason = opts.note?.trim() || "It did not meet the network's requirements.";

    const html = opts.approved
      ? senderIdApprovedEmail({ senderId: opts.senderId, smsUrl })
      : senderIdRejectedEmail({ senderId: opts.senderId, reason, smsUrl });

    const sms = opts.approved
      ? `EventHene: your Sender ID "${opts.senderId}" is approved. Your broadcasts now go out under that name.`
      : `EventHene: your Sender ID "${opts.senderId}" was not approved. ${reason} You can request another in your dashboard.`;

    const jobs: Promise<unknown>[] = [];
    const to = usableEmail(org.user.email);
    if (to) {
      jobs.push(
        sendEmail({
          to,
          subject: opts.approved
            ? `Your Sender ID "${opts.senderId}" is approved`
            : `About your Sender ID "${opts.senderId}"`,
          html,
        })
      );
    }
    // Platform-side message about the account, so it is not charged to the organizer.
    if (org.user.phone) jobs.push(sendSMS(org.user.phone, sms));

    await Promise.allSettled(jobs);
  } catch (e) {
    console.error("[sender-id] decision notification failed", e);
  }
}
