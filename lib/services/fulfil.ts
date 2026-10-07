import { issueTicketsForOrder } from "@/lib/services/tickets";
import { renderAndStoreTicketPdfs } from "@/lib/services/render";
import { sendTicketEmails } from "@/lib/services/notify";

/**
 * Everything that happens once an order is paid (or is free): issue tickets, render and
 * store the PDFs, then send the SMS and email. Each step is isolated so one failing
 * (for example email) never stops the buyer getting their ticket another way.
 */
export async function fulfilOrder(orderId: string, tag: string) {
  const tickets = await issueTicketsForOrder(orderId);

  const buffers = await renderAndStoreTicketPdfs(tickets.map((t) => t.ticketId)).catch((e) => {
    console.error(`[${tag}] PDF render failed`, e);
    return new Map<string, Buffer>();
  });

  await sendTicketEmails(orderId, buffers).catch((e) => console.error(`[${tag}] notifications failed`, e));
  return tickets;
}
