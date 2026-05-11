import { db } from "@/lib/db";
import { sendEmail, ticketIssuedEmail } from "@/lib/email";
import { formatDate } from "@/lib/utils";
import { renderTicketPdfBuffer } from "@/lib/services/render";

export async function sendTicketEmails(orderId: string): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      event: true,
      tickets: { include: { attendee: true, ticketType: true } }
    }
  });
  if (!order) return;

  // Group attendees by email (buyer may receive a digest of all tickets)
  for (const ticket of order.tickets) {
    const to = ticket.attendee.email || order.buyerEmail;
    if (!to) continue;
    let pdfBuffer: Buffer | undefined;
    try {
      pdfBuffer = await renderTicketPdfBuffer(ticket.id);
    } catch (e) {
      console.error("[notify] failed to render PDF for", ticket.id, e);
    }
    await sendEmail({
      to,
      subject: `🎟️ Your ticket for ${order.event.title}`,
      html: ticketIssuedEmail({
        attendeeName: ticket.attendee.fullName,
        eventTitle: order.event.title,
        eventDate: formatDate(order.event.startsAt, order.event.timezone),
        venue: order.event.venue,
        visibleRef: ticket.visibleRef,
        ticketUrl: ticket.pdfUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/tickets/lookup`
      }),
      attachments: pdfBuffer
        ? [{ filename: `${ticket.visibleRef}.pdf`, content: pdfBuffer }]
        : undefined
    });
  }
}
