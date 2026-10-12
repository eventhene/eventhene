export interface ParsedContact {
  name: string;
  phone: string;
  gender?: string;
}

const PHONE_LIKE = /^\+?[\d\s()-]{7,}$/;
const GENDER_LIKE = /^(m|f|male|female|man|woman|boy|girl)$/i;

function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') {
      quoted = !quoted;
    } else if ((ch === "," || ch === ";" || ch === "\t") && !quoted) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

/** Which column holds what, worked out from a header row. -1 means absent. */
interface ColumnMap {
  name: number;
  phone: number;
  gender: number;
}

function readHeader(parts: string[]): ColumnMap | null {
  const map: ColumnMap = { name: -1, phone: -1, gender: -1 };
  parts.forEach((raw, i) => {
    const h = raw.toLowerCase().replace(/[^a-z]/g, "");
    if (map.name === -1 && /^(name|fullname|contactname|contact)$/.test(h)) map.name = i;
    else if (map.phone === -1 && /(phone|number|mobile|msisdn|tel|contactnumber)/.test(h)) map.phone = i;
    else if (map.gender === -1 && /^(gender|sex)$/.test(h)) map.gender = i;
  });
  // A header row has to name at least a phone column to be worth trusting.
  return map.phone === -1 ? null : map;
}

/** Pulls name/phone/gender out of one row without a header to guide us. */
function rowWithoutHeader(parts: string[]): ParsedContact | null {
  const phoneIdx = parts.findIndex((p) => PHONE_LIKE.test(p));
  if (phoneIdx === -1) return null;
  const rest = parts.filter((_, i) => i !== phoneIdx);
  const genderIdx = rest.findIndex((p) => GENDER_LIKE.test(p));
  const gender = genderIdx === -1 ? undefined : rest[genderIdx];
  const name = rest.filter((_, i) => i !== genderIdx).join(" ");
  return { name, phone: parts[phoneIdx], gender };
}

function clean(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

/**
 * Parses pasted or uploaded text. Accepts "name,phone", "phone,name", a lone
 * phone number per line, and an optional Gender column (CSV, TSV, TXT).
 * A header row is detected and used to map columns when present.
 * Validation of the number itself happens on the server.
 */
export function parseContactsText(text: string): ParsedContact[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const result: ParsedContact[] = [];
  let cols: ColumnMap | null = null;

  lines.forEach((line, idx) => {
    const parts = splitLine(line).filter((p, i, a) => !(i === a.length - 1 && p === ""));
    if (parts.length === 0) return;

    // A first row that names columns and holds no phone number is a header.
    if (idx === 0 && !parts.some((p) => PHONE_LIKE.test(p))) {
      cols = readHeader(parts);
      if (cols || /name|phone|number|contact|mobile/i.test(line)) return;
    }

    if (cols) {
      const phone = parts[cols.phone] ?? "";
      if (!PHONE_LIKE.test(phone)) return;
      result.push({
        name: (cols.name === -1 ? "" : parts[cols.name] ?? "").trim(),
        phone: clean(phone),
        gender: cols.gender === -1 ? undefined : (parts[cols.gender] ?? "").trim() || undefined,
      });
      return;
    }

    const row = parts.length === 1 ? { name: "", phone: parts[0] } : rowWithoutHeader(parts);
    if (!row || !PHONE_LIKE.test(row.phone)) return;
    result.push({ ...row, phone: clean(row.phone) });
  });

  return result;
}

/** Splits free-typed numbers separated by commas, spaces or new lines. */
export function parseNumbersText(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((s) => s.replace(/[^\d+]/g, ""))
    .filter((s) => s.length >= 7);
}

/** Rows that came out of a spreadsheet, turned into the same shape as text rows. */
export function rowsToContacts(rows: (string | number | null | undefined)[][]): ParsedContact[] {
  const lines = rows
    .map((r) => r.map((c) => (c === null || c === undefined ? "" : String(c))).join("\t"))
    .filter((l) => l.replace(/\t/g, "").trim() !== "");
  return parseContactsText(lines.join("\n"));
}
