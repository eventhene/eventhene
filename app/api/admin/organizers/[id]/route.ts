import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { paystack } from "@/lib/payments/paystack";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole("SUPER_ADMIN", req);
    const body = await req.json().catch(() => ({}));
    const deleteAccount = body?.deleteAccount === true;

    const organizer = await db.organizer.findUnique({
      where: { id: params.id },
      include: { events: { select: { id: true } } },
    });

    if (!organizer) {
      return NextResponse.json({ error: "Organizer not found." }, { status: 404 });
    }

    const eventIds = organizer.events.map((e) => e.id);

    await db.$transaction(
      async (tx) => {
        if (eventIds.length > 0) {
          await tx.scanLog.deleteMany({ where: { eventId: { in: eventIds } } });
          await tx.ticket.deleteMany({ where: { eventId: { in: eventIds } } });
          await tx.attendee.deleteMany({ where: { eventId: { in: eventIds } } });
          await tx.order.deleteMany({ where: { eventId: { in: eventIds } } });
          await tx.review.deleteMany({ where: { eventId: { in: eventIds } } });
        }
        await tx.promotion.deleteMany({
          where: { OR: [{ organizerId: organizer.id }, { eventId: { in: eventIds } }] },
        });
        await tx.smsCampaign.deleteMany({
          where: { OR: [{ organizerId: organizer.id }, { eventId: { in: eventIds } }] },
        });
        await tx.serviceInquiry.updateMany({
          where: { organizerId: organizer.id },
          data: { organizerId: null },
        });
        await tx.deletedRecord.deleteMany({ where: { organizerId: organizer.id } });
        await tx.event.deleteMany({ where: { organizerId: organizer.id } });
        await tx.organizer.delete({ where: { id: organizer.id } });
        await tx.user.update({
          where: { id: organizer.userId },
          data: { role: "ATTENDEE" },
        });
      },
      { timeout: 30000, maxWait: 10000 }
    );

    // Paystack cannot delete subaccounts, so deactivate it so it can no longer receive payments.
    let subaccountDeactivated = false;
    if (organizer.paystackSubacct) {
      try {
        await paystack.deactivateSubaccount(organizer.paystackSubacct);
        subaccountDeactivated = true;
      } catch (err) {
        console.error("[admin/organizers/delete] could not deactivate Paystack subaccount", err);
      }
    }

    // Optionally remove the login account too, so the email can be used to sign up again.
    let accountDeleted = false;
    let accountNote: string | undefined;
    if (deleteAccount) {
      const owner = await db.user.findUnique({ where: { id: organizer.userId } });
      if (!owner) {
        accountNote = "Login account was already gone.";
      } else if (owner.role === "ADMIN" || owner.role === "SUPER_ADMIN") {
        accountNote = "Login kept: this is an admin account.";
      } else {
        const [scans, logs, coupons] = await Promise.all([
          db.scanLog.count({ where: { scannedById: owner.id } }),
          db.adminLog.count({ where: { actorId: owner.id } }),
          db.coupon.count({ where: { createdBy: owner.id } }),
        ]);
        if (scans + logs + coupons > 0) {
          accountNote = "Login kept: it has scan or admin history that must be preserved.";
        } else {
          await db.$transaction(async (tx) => {
            await tx.order.updateMany({ where: { buyerUserId: owner.id }, data: { buyerUserId: null } });
            await tx.supportTicket.updateMany({ where: { userId: owner.id }, data: { userId: null } });
            await tx.otp.deleteMany({ where: { userId: owner.id } });
            await tx.user.delete({ where: { id: owner.id } });
          });
          accountDeleted = true;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      eventsDeleted: eventIds.length,
      subaccountDeactivated,
      accountDeleted,
      accountNote,
    });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    console.error("[admin/organizers/delete]", e);
    return NextResponse.json({ error: e?.message || "internal_error" }, { status: 500 });
  }
}
