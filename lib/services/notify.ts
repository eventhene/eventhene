import { db } from "@/lib/db";
import { sendEmail, ticketIssuedEmail } from "@/lib/email";
import { formatDate } from "@/lib/utils";
import { renderTicketPdfBuffer } from "@/lib/services/render";
import { sendSMS } from "@/lib/sms/hubtel";

export async function sendTicketEmails(orderId: string): Promise<void> {
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
    // Email (best-effort, may fail without custom domain)
    const emailTo = ticket.attendee.email || order.buyerEmail;
    if (emailTo) {
      let pdfBuffer: Buffer | undefined;
      try {
        pdfBuffer = await renderTicketPdfBuffer(ticket.id);
      } catch (e) {
        console.error("[notify] failed to render PDF for", ticket.id, e);
      }
      await sendEmail({
        to: emailTo,
        subject: `Your ticket for ${order.event.title}`,
        html: ticketIssuedEmail({
          attendeeName: ticket.attendee.fullName,
          eventTitle: order.event.title,
          eventDate,
          venue: order.event.venue,
          visibleRef: ticket.visibleRef,
          ticketUrl: ticket.pdfUrl ?? `${appUrl}/tickets/lookup`
        }),
        attachments: pdfBuffer
          ? [{ filename: `${ticket.visibleRef}.pdf`, content: pdfBuffer }]
          : undefined
      }).catch((e) => console.error("[notify] email failed for", ticket.id, e));
    }

    // SMS confirmation (primary delivery channel)
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
        `Lookup: ${appUrl}/tickets/lookup`,
      ].join("\n");

      await sendSMS(phone, msg).catch((e) =>
        console.error("[notify] SMS failed for", ticket.id, e)
      );
    }
  }
}
