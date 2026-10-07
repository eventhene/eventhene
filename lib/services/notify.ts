import { db } from "@/lib/db";
import { sendEmailDetailed, ticketIssuedEmail } from "@/lib/email";
import { formatDate } from "@/lib/utils";
import { renderTicketPdfBuffer } from "@/lib/services/render";
import { sendSMS } from "@/lib/sms/hubtel";

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

  for (const ticket of order.tickets) {
    // 1) SMS confirmation (fast path)
    const phone = ticket.attendee.phone || order.buyerPhone;
    if (phone) {
      const msg = [
        `EventHene - Ticket Confirmed!`,
        ``,
        `${order.event.title}`,
        `Date: ${eventDate}`,
        `Venue: ${order.event.venue}`,
        `Ticket: ${ticket.ticketType.name}`,
        `Ref: ${ticket.visibleRef}`,
        ``,
        `Show this ref or your QR code at the gate.`,
        `Get your ticket: ${appUrl}/orders/${order.id}/success`,
      ].join("\n");

      const sms = await sendSMS(phone, msg);
      if (!sms.ok) console.error("[notify] SMS failed for", ticket.id, sms.error);
    }

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
