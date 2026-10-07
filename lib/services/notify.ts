import { db } from "@/lib/db";
import { sendEmailDetailed, ticketIssuedEmail } from "@/lib/email";
import { formatDate } from "@/lib/utils";
import { renderTicketPdfBuffer } from "@/lib/services/render";
import { sendSMS } from "@/lib/sms/hubtel";
import { smsSegments } from "@/lib/sms/segments";
import { chargeCredits, refundCredits } from "@/lib/sms/credits";

const MAX_SMS_PER_PHONE_PER_DAY = 10;

function shortDate(d: Date, tz: string): string {
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: tz });
}

/** Builds the confirmation text and trims the title until it fits in ONE SMS segment. */
function confirmationSms(opts: { title: string; date: string; ref: string; url: string }): string {
  let title = opts.title;
  for (;;) {
    const msg = [
      "EventHene ticket confirmed!",
      title,
      opts.date,
      `Ref: ${opts.ref}`,
      opts.url,
    ].join("\n");
    if (smsSegments(msg).segments <= 1 || title.length <= 8) return msg;
    title = title.slice(0, Math.max(8, title.length - 4)).trimEnd();
  }
}

/**
 * Sends the ticket confirmation for every ticket on an order.
 * The SMS goes first because it is fast and almost always arrives; then the email,
 * reusing the PDF that was already rendered when available.
 */
export async function sendTicketEmails(orderId: string, pdfBuffers?: Map<string, Buffer>): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      event: true,
      tickets: { include: { attendee: true, ticketType: true } }
    }
  });
  if (!order) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://eventhene.vercel.app";
  const eventDate = formatDate(order.event.startsAt, order.event.timezone);

  // Who pays for the confirmation SMS:
  //  - paid events: EventHene (it is covered by the 8% platform fee)
  //  - free events: the organizer, from their SMS credits (1 credit per message)
  const organizerPays = order.event.type === "FREE";
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const smsPlan: Array<{ ticketId: string; phone: string; msg: string }> = [];
  for (const ticket of order.tickets) {
    const phone = ticket.attendee.phone || order.buyerPhone;
    if (!phone) continue;
    // Abuse guard: stop one number being used to burn SMS (cost) in a day.
    const recent = await db.attendee.count({ where: { phone, createdAt: { gte: since } } });
    if (recent > MAX_SMS_PER_PHONE_PER_DAY) {
      console.warn("[notify] SMS skipped, daily limit reached for a number");
      continue;
    }
    smsPlan.push({
      ticketId: ticket.id,
      phone,
      msg: confirmationSms({
        title: order.event.title,
        date: shortDate(order.event.startsAt, order.event.timezone),
        ref: ticket.visibleRef,
        url: `${appUrl}/t/${ticket.visibleRef}`,
      }),
    });
  }

  // 1) SMS confirmations (fast path)
  const smsSent = new Set<string>();
  let chargedCredits = 0;
  if (smsPlan.length > 0) {
    let canSend = true;
    if (organizerPays) {
      chargedCredits = smsPlan.reduce((n, p) => n + smsSegments(p.msg).segments, 0);
      try {
        await chargeCredits({
          organizerId: order.event.organizerId,
          amount: chargedCredits,
          note: `Ticket confirmation SMS - ${order.event.title} (${smsPlan.length})`,
        });
      } catch (e: any) {
        canSend = false;
        chargedCredits = 0;
        console.warn("[notify] ticket SMS skipped, organizer credits unavailable:", e?.message);
      }
    }
    if (canSend) {
      let failedCredits = 0;
      for (const p of smsPlan) {
        const sms = await sendSMS(p.phone, p.msg);
        if (sms.ok) smsSent.add(p.ticketId);
        else {
          failedCredits += smsSegments(p.msg).segments;
          console.error("[notify] SMS failed for", p.ticketId, sms.error);
        }
      }
      if (organizerPays && failedCredits > 0) {
        await refundCredits({
          organizerId: order.event.organizerId,
          amount: failedCredits,
          note: "Refund for ticket confirmation SMS that could not be delivered",
        }).catch(() => {});
      }
    }
  }

  for (const ticket of order.tickets) {

    // 2) Email with the PDF attached
    const emailTo = ticket.attendee.email || order.buyerEmail;
    if (emailTo) {
      let pdfBuffer = pdfBuffers?.get(ticket.id);
      if (!pdfBuffer) {
        try {
          pdfBuffer = await renderTicketPdfBuffer(ticket.id);
        } catch (e) {
          console.error("[notify] failed to render PDF for", ticket.id, e);
        }
      }
      const result = await sendEmailDetailed({
        to: emailTo,
        subject: `Your ticket for ${order.event.title}`,
        html: ticketIssuedEmail({
          attendeeName: ticket.attendee.fullName,
          eventTitle: order.event.title,
          eventDate,
          venue: order.event.venue,
          visibleRef: ticket.visibleRef,
          ticketUrl: `${appUrl}/orders/${order.id}/success`
        }),
        attachments: pdfBuffer
          ? [{ filename: `${ticket.visibleRef}.pdf`, content: pdfBuffer }]
          : undefined
      });
      if (!result.ok) console.error("[notify] email failed for", ticket.id, result.error);
    }
  }
}
