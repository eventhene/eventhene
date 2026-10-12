import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { db } from "@/lib/db";
import { requireOrganizer } from "@/lib/auth";
import { importContacts, MAX_CONTACTS_PER_REQUEST } from "@/lib/sms/contacts";
import { parseContactsText, rowsToContacts, type ParsedContact } from "@/lib/sms/parse-contacts";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

/** Reads the first worksheet into plain rows so the shared text parser can map columns. */
async function parseWorkbook(buf: Buffer): Promise<ParsedContact[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as any);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  const rows: (string | number | null)[][] = [];
  ws.eachRow({ includeEmpty: false }, (row) => {
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    rows.push(
      values.map((v: any) => {
        if (v === null || v === undefined) return "";
        // Cells can arrive as rich text or formula results.
        if (typeof v === "object") return String(v.result ?? v.text ?? v.hyperlink ?? "");
        return v as string | number;
      })
    );
  });
  return rowsToContacts(rows);
}

/** Accepts a .xlsx, .csv, .tsv or .txt upload and adds its rows to a contact list. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { organizer } = await requireOrganizer(req);
    const list = await db.contactList.findUnique({ where: { id: params.id } });
    if (!list || list.organizerId !== organizer.id) {
      return NextResponse.json({ error: "List not found." }, { status: 404 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "That file is too large (5MB max)." }, { status: 413 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const isExcel =
      /\.xlsx$/i.test(file.name) ||
      file.type.includes("spreadsheetml") ||
      (buf.length > 1 && buf[0] === 0x50 && buf[1] === 0x4b); // zip magic, so .xlsx

    if (/\.xls$/i.test(file.name) && !isExcel) {
      return NextResponse.json(
        { error: "Old .xls files are not supported. Save as .xlsx or CSV and try again." },
        { status: 415 }
      );
    }

    let contacts: ParsedContact[];
    try {
      contacts = isExcel ? await parseWorkbook(buf) : parseContactsText(buf.toString("utf8"));
    } catch {
      return NextResponse.json({ error: "That file could not be read. Try saving it as CSV." }, { status: 400 });
    }

    if (contacts.length === 0) {
      return NextResponse.json(
        { error: "No contacts found. Expected columns: Name, PhoneNumber and optionally Gender." },
        { status: 400 }
      );
    }

    const stats = await importContacts(list.id, contacts.slice(0, MAX_CONTACTS_PER_REQUEST));
    const withGender = contacts.filter((c) => c.gender).length;
    return NextResponse.json({ ok: true, stats, parsed: contacts.length, withGender });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: e.message || "forbidden" }, { status: 403 });
    console.error("[sms/contact-lists/:id/import]", e);
    return NextResponse.json({ error: "Something went wrong reading that file." }, { status: 500 });
  }
}
