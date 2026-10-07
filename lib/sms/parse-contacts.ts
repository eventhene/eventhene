export interface ParsedContact {
  name: string;
  phone: string;
}

const PHONE_LIKE = /^\+?[\d\s()-]{7,}$/;

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

/**
 * Parses pasted or uploaded text. Accepts "name,phone", "phone,name", or a lone
 * phone number per line (CSV, TSV, TXT). A header row is detected and skipped.
 * Validation of the number itself happens on the server.
 */
export function parseContactsText(text: string): ParsedContact[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const result: ParsedContact[] = [];

  lines.forEach((line, idx) => {
    const parts = splitLine(line).filter((p) => p !== "");
    if (parts.length === 0) return;

    if (idx === 0 && /name|phone|number|contact|mobile/i.test(line) && !parts.some((p) => PHONE_LIKE.test(p))) {
      return;
    }

    let name = "";
    let phone = "";
    if (parts.length === 1) {
      phone = parts[0];
    } else {
      const phoneIdx = parts.findIndex((p) => PHONE_LIKE.test(p));
      if (phoneIdx === -1) return;
      phone = parts[phoneIdx];
      name = parts.filter((_, i) => i !== phoneIdx).join(" ");
    }
    if (!PHONE_LIKE.test(phone)) return;
    result.push({ name, phone: phone.replace(/[^\d+]/g, "") });
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
