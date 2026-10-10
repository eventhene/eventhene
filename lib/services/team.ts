import { getAppUrl } from "@/lib/app-url";
import { customAlphabet } from "nanoid";
import { db } from "@/lib/db";
import { sendSMS } from "@/lib/sms/hubtel";
import { normalizeGhPhone } from "@/lib/sms/phone";
import { markPhoneVerified } from "@/lib/auth/verification";
import type { TeamRole } from "@prisma/client";

const tokenId = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 22);
const INVITE_DAYS = 7;

export const ROLE_LABEL: Record<TeamRole, string> = {
  MANAGER: "Manager",
  SCANNER: "Scanner",
};

export function appUrl(): string {
  return getAppUrl();
}

export function inviteLink(token: string): string {
  return `${appUrl()}/invite/team/${token}`;
}

function inviteSmsText(orgName: string, role: TeamRole, token: string): string {
  const what =
    role === "MANAGER"
      ? "help manage their events"
      : "scan tickets at their events";
  return `EventHene: ${orgName} invited you to ${what}. Hello! Tap to set up your account: ${inviteLink(token)}`;
}

export async function createTeamInvite(opts: {
  organizerId: string;
  organizerName: string;
  invitedById: string;
  phone: string;
  role: TeamRole;
  eventIds?: string[];
}) {
  const phone = normalizeGhPhone(opts.phone);
  if (!phone) throw new Error("Enter a valid Ghana phone number.");

  let eventIds: string[] = [];
  if (opts.role === "SCANNER" && opts.eventIds?.length) {
    const owned = await db.event.findMany({
      where: { id: { in: opts.eventIds }, organizerId: opts.organizerId },
      select: { id: true },
    });
    eventIds = owned.map((e) => e.id);
    if (eventIds.length === 0) throw new Error("Choose at least one of your events.");
  }

  const duplicate = await db.teamInvite.findFirst({
    where: { organizerId: opts.organizerId, phone, status: "PENDING", expiresAt: { gt: new Date() } },
  });
  if (duplicate) {
    throw new Error("This number already has a pending invite. Resend it from the list below.");
  }

  const existingUser = await db.user.findFirst({
    where: { phone: { in: [phone, "0" + phone.slice(3), "+" + phone] } },
    select: { id: true },
  });
  if (existingUser) {
    const alreadyMember = await db.teamMember.findUnique({
      where: { organizerId_userId: { organizerId: opts.organizerId, userId: existingUser.id } },
    });
    if (alreadyMember) throw new Error("That person is already on your team.");
  }

  const invite = await db.teamInvite.create({
    data: {
      token: tokenId(),
      organizerId: opts.organizerId,
      phone,
      role: opts.role,
      eventIds,
      invitedById: opts.invitedById,
      expiresAt: new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  const sms = await sendSMS(phone, inviteSmsText(opts.organizerName, opts.role, invite.token));
  return { invite, smsSent: sms.ok, smsError: sms.ok ? undefined : sms.error };
}

export async function resendTeamInvite(inviteId: string, organizerId: string, organizerName: string) {
  const invite = await db.teamInvite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.organizerId !== organizerId || invite.status !== "PENDING") {
    throw new Error("Invite not found.");
  }
  const refreshed = await db.teamInvite.update({
    where: { id: invite.id },
    data: { expiresAt: new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000) },
  });
  const sms = await sendSMS(refreshed.phone, inviteSmsText(organizerName, refreshed.role, refreshed.token));
  return { smsSent: sms.ok, smsError: sms.ok ? undefined : sms.error };
}

/** Accepts an invite for a signed-in user whose verified phone matches the invite. */
export async function acceptTeamInvite(token: string, user: { id: string; phone: string | null }) {
  const invite = await db.teamInvite.findUnique({ where: { token } });
  if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    throw new Error("This invite is no longer valid. Ask for a new one.");
  }
  const userPhone = user.phone ? normalizeGhPhone(user.phone) : null;
  if (!userPhone || userPhone !== invite.phone) {
    throw new Error("This invite was sent to a different phone number than your account.");
  }

  const ownOrganizer = await db.organizer.findUnique({ where: { userId: user.id } });
  if (ownOrganizer && ownOrganizer.id === invite.organizerId) {
    throw new Error("You already own this organizer account.");
  }

  await db.$transaction(async (tx) => {
    await tx.teamMember.upsert({
      where: { organizerId_userId: { organizerId: invite.organizerId, userId: user.id } },
      create: {
        organizerId: invite.organizerId,
        userId: user.id,
        role: invite.role,
        eventIds: invite.eventIds,
      },
      update: { role: invite.role, eventIds: invite.eventIds },
    });
    await tx.teamInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED", acceptedUserId: user.id },
    });
  });
  await markPhoneVerified(user.id);

  return { role: invite.role, organizerId: invite.organizerId };
}
