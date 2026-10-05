/**
 * SMS segment calculator.
 *
 * GSM-7: 160 chars for 1 segment, 153 per segment when > 160.
 * UCS-2 (any non-GSM char): 70 for 1 segment, 67 per segment when > 70.
 *
 * We treat the GSM-7 extension chars (|, ^, {, }, [, ], ~, \, €) as 2 chars
 * for segment accounting, per the GSM 03.38 spec.
 */

const GSM7_BASIC = new Set(
  (
    "@£$¥èéùìòÇ\nØø\rÅå" +
    "Δ_ΦΓΛΩΠΨΣΘΞ" +
    " !\"#¤%&'()*+,-./0123456789:;<=>?" +
    "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§" +
    "¿abcdefghijklmnopqrstuvwxyzäöñüà"
  ).split("")
);

const GSM7_EXT = new Set(["|", "^", "{", "}", "[", "]", "~", "\\", "€", "\f"]);

export type SmsEncoding = "GSM-7" | "UCS-2";

export interface SmsSegmentInfo {
  encoding: SmsEncoding;
  charCount: number;      // effective char count (extension chars counted as 2 in GSM-7)
  segments: number;
  perSegment: number;     // chars allowed per segment (for display)
  remaining: number;      // chars left before next segment
}

function gsm7CharWeight(ch: string): number | null {
  if (GSM7_EXT.has(ch)) return 2;
  if (GSM7_BASIC.has(ch)) return 1;
  return null; // non-GSM
}

export function smsSegments(text: string): SmsSegmentInfo {
  const input = text ?? "";

  // Decide encoding
  let isGsm = true;
  let weighted = 0;
  for (const ch of input) {
    const w = gsm7CharWeight(ch);
    if (w === null) { isGsm = false; break; }
    weighted += w;
  }

  if (isGsm) {
    const total = weighted;
    const perSegment = total <= 160 ? 160 : 153;
    const segments = total === 0 ? 1 : (total <= 160 ? 1 : Math.ceil(total / 153));
    const used = segments === 1 ? total : total;
    const cap = segments * perSegment;
    return {
      encoding: "GSM-7",
      charCount: total,
      segments,
      perSegment,
      remaining: Math.max(0, cap - used),
    };
  }

  // UCS-2 path (count by code points, surrogate pairs = 2 code units)
  const codeUnits = Array.from(input).reduce((n, ch) => n + (ch.codePointAt(0)! > 0xFFFF ? 2 : 1), 0);
  const total = codeUnits;
  const perSegment = total <= 70 ? 70 : 67;
  const segments = total === 0 ? 1 : (total <= 70 ? 1 : Math.ceil(total / 67));
  const cap = segments * perSegment;
  return {
    encoding: "UCS-2",
    charCount: total,
    segments,
    perSegment,
    remaining: Math.max(0, cap - total),
  };
}
