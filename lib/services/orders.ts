import { getAppUrl } from "@/lib/app-url";
import { db } from "@/lib/db";
import { computeOrderTotals } from "@/lib/fees";
import { paystack } from "@/lib/payments/paystack";

export interface OrderItemInput {
  ticketTypeId: string;
  quantity: number;
  attendees: Array<{
    fullName: string;
    email?: string;
    phone?: string;
    gender?: string;
    city?: string;
    address?: string;
    organization?: string;
    ageRange?: string;
    emergencyContact?: string;
    customAnswers?: Record<string, unknown>;
  }>;
}

export interface CreateOrderInput {
  eventId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  buyerUserId?: string;
  items: OrderItemInput[];
}

export interface CreateOrderResult {
  mode: "free" | "paid";
  orderId: string;
  authorizationUrl?: string;
  accessCode?: string;
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  return db.$transaction(async (tx) => {
    const event = await tx.event.findUnique({
      where: { id: input.eventId },
      include: { ticketTypes: true }
    });
    if (!event) throw new Error("event_not_found");
    if (event.status !== "PUBLISHED") throw new Error("event_not_open");

    const now = new Date();
    if (now < event.bookingOpensAt) throw new Error("booking_not_open_yet");
    if (now > event.bookingClosesAt) throw new Error("booking_closed");

    let subtotalMinor = 0;
    for (const item of input.items) {
      const tt = event.ticketTypes.find((t) => t.id === item.ticketTypeId);
      if (!tt || !tt.isActive) throw new Error("ticket_type_invalid");
      if (item.quantity < 1 || item.quantity > 10) throw new Error("quantity_invalid");
      if (item.attendees.length !== item.quantity) throw new Error("attendee_count_mismatch");
      if (tt.sold + item.quantity > tt.quantity) throw new Error("sold_out");
      subtotalMinor += tt.priceMinor * item.quantity;

      // Free tickets are issued instantly, so reserve stock now. Paid tickets only
      // count as sold once payment succeeds (see issueTicketsForOrder).
      if (event.type === "FREE") {
        const updated = await tx.ticketType.updateMany({
          where: { id: tt.id, sold: tt.sold },
          data: { sold: { increment: item.quantity } }
        });
        if (updated.count === 0) throw new Error("inventory_race");
      }
    }

    if (event.type === "FREE") {
      const order = await tx.order.create({
        data: {
          eventId: event.id,
          buyerUserId: input.buyerUserId,
          buyerName: input.buyerName,
          buyerEmail: input.buyerEmail,
          buyerPhone: input.buyerPhone,
          subtotalMinor: 0,
          platformFeeMinor: 0,
          processorFeeMinor: 0,
          totalMinor: 0,
          currency: event.currency,
          status: "PAID",
          paidAt: new Date(),
          provider: "MANUAL",
          draftPayload: input as any
        }
      });
      return { mode: "free" as const, orderId: order.id };
    }

    const totals = computeOrderTotals({
      subtotalMinor,
      country: event.country,
      buyerPaysFee: event.buyerPaysFee
    });

    const order = await tx.order.create({
      data: {
        eventId: event.id,
        buyerUserId: input.buyerUserId,
        buyerName: input.buyerName,
        buyerEmail: input.buyerEmail,
        buyerPhone: input.buyerPhone,
        subtotalMinor: totals.subtotalMinor,
        platformFeeMinor: totals.platformFeeMinor,
        processorFeeMinor: totals.processorFeeMinor,
        totalMinor: totals.totalMinor,
        currency: event.currency,
        status: "PENDING",
        provider: "PAYSTACK",
        draftPayload: input as any
      }
    });

    const organizer = await tx.organizer.findUnique({ where: { id: event.organizerId } });
    const paystackOpts: Parameters<typeof paystack.initialize>[0] = {
      email: input.buyerEmail,
      amountMinor: totals.totalMinor,
      currency: event.currency,
      reference: order.id,
      callbackUrl: `${getAppUrl()}/orders/${order.id}/success`,
      metadata: { eventId: event.id, buyerName: input.buyerName },
    };

    if (organizer?.paystackSubacct) {
      paystackOpts.subaccount = organizer.paystackSubacct;
      paystackOpts.bearer = "account";
      paystackOpts.transactionChargeMinor = totals.totalMinor - totals.organizerNetMinor;
    }

    const init = await paystack.initialize(paystackOpts);

    return { mode: "paid" as const, orderId: order.id, authorizationUrl: init.authorization_url, accessCode: init.access_code };
  });
}
