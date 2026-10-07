// One-off: set TicketType.sold to the real number of issued tickets.
// Usage: DATABASE_URL=... DIRECT_URL=... node scripts/reconcile-sold.js [--apply]
const { PrismaClient } = require("@prisma/client");

async function main() {
  const apply = process.argv.includes("--apply");
  const db = new PrismaClient();
  const types = await db.ticketType.findMany({ include: { event: { select: { title: true } } } });
  let changed = 0;
  for (const t of types) {
    const real = await db.ticket.count({
      where: { ticketTypeId: t.id, status: { in: ["TICKET_ISSUED", "PAID", "REGISTERED", "ATTENDED"] } },
    });
    if (real !== t.sold) {
      changed++;
      console.log(`${t.event.title} / ${t.name}: sold ${t.sold} -> ${real}`);
      if (apply) await db.ticketType.update({ where: { id: t.id }, data: { sold: real } });
    }
  }
  console.log(changed === 0 ? "Nothing to fix." : `${apply ? "Fixed" : "Would fix"} ${changed} ticket type(s).`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
