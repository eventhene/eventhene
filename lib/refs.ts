import { customAlphabet } from "nanoid";

const numericId = customAlphabet("0123456789", 4);

/** Sanitize and uppercase the first 3 letters of a name. */
export function sanitizeFirst3(name: string): string {
  const cleaned = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();
  return (cleaned + "XXX").slice(0, 3);
}

/** Build the human-visible ticket reference: WOR-DJKAY-4134123 */
export function buildVisibleRef(firstName: string, eventCode: string): string {
  return `${sanitizeFirst3(firstName)}-${eventCode.toUpperCase()}-${numericId()}`;
}

/** Generate a short event code from a title: "DJ Kay Birthday Bash" -> "DJKAYBIR" */
export function generateShortCode(title: string): string {
  const tokens = title
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  const code = tokens.map((t) => t.slice(0, 3)).join("").slice(0, 8);
  return code || "EVENT";
}
