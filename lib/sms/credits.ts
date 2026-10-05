import { db } from "@/lib/db";
import type { SmsTxnKind } from "@prisma/client";

export class InsufficientCreditsError extends Error {
  code = "insufficient_credits";
  constructor(public needed: number, public have: number) {
    super(`Not enough SMS credits. Need ${needed}, have ${have}.`);
  }
}

export class SmsFrozenError extends Error {
  code = "sms_frozen";
  constructor() { super("SMS sending is frozen for this account. Contact support."); }
}

/**
 * Atomically deduct credits from an organizer, writing a transaction row.
 * Throws if balance would go negative or account is frozen.
 */
export async function chargeCredits(opts: {
  organizerId: string;
  amount: number;      // positive number of segments to deduct
  note?: string;
  actorId?: string;
  campaignId?: string;
}): Promise<{ balanceAfter: number }> {
  if (opts.amount <= 0) return { balanceAfter: 0 };

  return db.$transaction(async (tx) => {
    const org = await tx.organizer.findUnique({
      where: { id: opts.organizerId },
      select: { id: true, smsBalance: true, smsFrozen: true },
    });
    if (!org) throw new Error("organizer_not_found");
    if (org.smsFrozen) throw new SmsFrozenError();
    if (org.smsBalance < opts.amount) {
      throw new InsufficientCreditsError(opts.amount, org.smsBalance);
    }

    const updated = await tx.organizer.update({
      where: { id: org.id, smsBalance: org.smsBalance },
      data: { smsBalance: { decrement: opts.amount } },
    });

    await tx.smsTransaction.create({
      data: {
        organizerId: org.id,
        kind: "DEDUCT",
        amount: -opts.amount,
        balanceAfter: updated.smsBalance,
        note: opts.note,
        actorId: opts.actorId,
        campaignId: opts.campaignId,
      },
    });
    return { balanceAfter: updated.smsBalance };
  });
}

/** Refund credits (e.g. unused recipients, provider error). */
export async function refundCredits(opts: {
  organizerId: string;
  amount: number;
  note?: string;
  actorId?: string;
  campaignId?: string;
}): Promise<{ balanceAfter: number }> {
  if (opts.amount <= 0) return { balanceAfter: 0 };
  return db.$transaction(async (tx) => {
    const org = await tx.organizer.update({
      where: { id: opts.organizerId },
      data: { smsBalance: { increment: opts.amount } },
    });
    await tx.smsTransaction.create({
      data: {
        organizerId: org.id,
        kind: "REFUND",
        amount: opts.amount,
        balanceAfter: org.smsBalance,
        note: opts.note,
        actorId: opts.actorId,
        campaignId: opts.campaignId,
      },
    });
    return { balanceAfter: org.smsBalance };
  });
}

/** Grant credits (admin action). */
export async function grantCredits(opts: {
  organizerId: string;
  amount: number;
  kind?: SmsTxnKind;    // GRANT | PURCHASE | ADJUST
  note?: string;
  actorId?: string;
}): Promise<{ balanceAfter: number }> {
  if (opts.amount === 0) return { balanceAfter: 0 };
  const kind = opts.kind ?? "GRANT";

  return db.$transaction(async (tx) => {
    const org = await tx.organizer.update({
      where: { id: opts.organizerId },
      data: { smsBalance: { increment: opts.amount } },
    });
    await tx.smsTransaction.create({
      data: {
        organizerId: org.id,
        kind,
        amount: opts.amount,
        balanceAfter: org.smsBalance,
        note: opts.note,
        actorId: opts.actorId,
      },
    });
    return { balanceAfter: org.smsBalance };
  });
}
