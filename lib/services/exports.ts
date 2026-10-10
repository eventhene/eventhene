import ExcelJS from "exceljs";
import { db } from "@/lib/db";

export type ExportFilter = "all" | "attended" | "unattended";
export type ExportFormat = "csv" | "xlsx";

export async function exportAttendees(opts: {
  eventId: string;
  filter: ExportFilter;
  ticketTypeId?: string;
  format: ExportFormat;
}): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
  const where: any = { eventId: opts.eventId };
  if (opts.filter === "attended") where.status = "ATTENDED";
  if (opts.filter === "unattended") {
    where.status = { in: ["TICKET_ISSUED", "PAID", "REGISTERED"] };
  }
  if (opts.ticketTypeId) where.ticketTypeId = opts.ticketTypeId;

  const tickets = await db.ticket.findMany({
    where,
    include: { attendee: true, ticketType: true, event: true, order: true },
    orderBy: { createdAt: "asc" }
  });

  const event = tickets[0]?.event;
  const filenameBase = (event?.slug || "attendees").slice(0, 40);

  // Collect custom answer keys across all attendees
  const customKeys = new Set<string>();
  for (const t of tickets) {
    if (t.attendee.customAnswers && typeof t.attendee.customAnswers === "object") {
      Object.keys(t.attendee.customAnswers as object).forEach((k) => customKeys.add(k));
    }
  }
  const customKeysArr = Array.from(customKeys);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "EventHene";
  const ws = workbook.addWorksheet("Attendees");
  ws.columns = [
    { header: "Ticket Ref", key: "ref", width: 22 },
    { header: "Event", key: "event", width: 28 },
    { header: "Ticket Type", key: "type", width: 16 },
    { header: "Full Name", key: "name", width: 24 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Email", key: "email", width: 28 },
    { header: "Gender", key: "gender", width: 10 },
    { header: "City", key: "city", width: 14 },
    { header: "Address", key: "address", width: 28 },
    { header: "Organization", key: "org", width: 22 },
    { header: "Age Range", key: "age", width: 12 },
    { header: "Emergency Contact", key: "emerg", width: 22 },
    ...customKeysArr.map((k) => ({ header: k, key: `c_${k}`, width: 20 })),
    { header: "Order Status", key: "orderStatus", width: 14 },
    { header: "Ticket Status", key: "status", width: 14 },
    { header: "Booked At", key: "booked", width: 22 },
    { header: "Scanned At", key: "scanned", width: 22 }
  ];

  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4B1E78" }
  };
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  for (const t of tickets) {
    const ca = (t.attendee.customAnswers ?? {}) as Record<string, unknown>;
    const customCols = customKeysArr.reduce<Record<string, unknown>>((acc, k) => {
      acc[`c_${k}`] = ca[k] ?? "";
      return acc;
    }, {});
    ws.addRow({
      ref: t.visibleRef,
      event: t.event.title,
      type: t.ticketType.name,
      name: t.attendee.fullName,
      phone: t.attendee.phone ?? "",
      email: t.attendee.email ?? "",
      gender: t.attendee.gender ?? "",
      city: t.attendee.city ?? "",
      address: t.attendee.address ?? "",
      org: t.attendee.organization ?? "",
      age: t.attendee.ageRange ?? "",
      emerg: t.attendee.emergencyContact ?? "",
      ...customCols,
      orderStatus: t.order?.status ?? "",
      status: t.status,
      booked: t.createdAt,
      scanned: t.usedAt ?? ""
    });
  }

  if (opts.format === "csv") {
    const buf = await workbook.csv.writeBuffer();
    return {
      buffer: Buffer.from(buf as ArrayBuffer),
      filename: `${filenameBase}-${opts.filter}.csv`,
      mimeType: "text/csv"
    };
  }
  const xlsx = await workbook.xlsx.writeBuffer();
  return {
    buffer: Buffer.from(xlsx as ArrayBuffer),
    filename: `${filenameBase}-${opts.filter}.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  };
}
