/**
 * Normalize a Ghana phone number to Hubtel's expected format: 233XXXXXXXXX (no +).
 * Accepts:
 *   0247...   (10 digits, leading 0)
 *   +233...   (international)
 *   233...    (country code without +)
 *   247...    (9 digits, missing leading 0)
 * Returns null if the input cannot be parsed.
 */
export function normalizeGhPhone(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;

  // 233 + 9 digits = 12 total (country code format)
  if (digits.length === 12 && digits.startsWith("233")) return digits;
  // 00233... (international prefix via 00)
  if (digits.length === 14 && digits.startsWith("00233")) return digits.slice(2);
  // 0XXXXXXXXX (local, 10 digits)
  if (digits.length === 10 && digits.startsWith("0")) return "233" + digits.slice(1);
  // 9 digits, no leading 0
  if (digits.length === 9) return "233" + digits;

  // Fallback: if already clearly international (12-15 digits), return as-is only if
  // not Ghana-shaped we return null so the caller skips it.
  return null;
}

export function isValidGhPhone(raw: string): boolean {
  return normalizeGhPhone(raw) !== null;
}
