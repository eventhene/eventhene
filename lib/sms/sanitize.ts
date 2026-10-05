/**
 * Make a string safe for GSM-7 SMS transport.
 * - Smart quotes/dashes converted to ASCII equivalents.
 * - Non-ASCII and emoji stripped (otherwise message would downgrade to UCS-2).
 * - "https://" and "http://" removed from inline links to save characters.
 * - Whitespace collapsed.
 * - Capped at 1000 characters.
 */
export function sanitizeSmsContent(input: string): string {
  if (!input) return "";
  let s = String(input);

  // Smart quotes and dashes
  s = s
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[–—―−]/g, "-")
    .replace(/…/g, "...")
    .replace(/ /g, " "); // non-breaking space -> space

  // Strip http(s):// from links so a link eats fewer chars
  s = s.replace(/https?:\/\//gi, "");

  // Strip emoji and any non-ASCII character
  s = s.replace(/[^\x20-\x7E\n\r\t]/g, "");

  // Collapse whitespace runs (preserve newlines as single \n)
  s = s.replace(/[ \t]+/g, " ");
  s = s.replace(/\n{3,}/g, "\n\n");
  s = s.trim();

  // Hard cap 1000 chars
  if (s.length > 1000) s = s.slice(0, 1000);
  return s;
}

/** Simple personalization: swap {name}, {ref}, {event}, {date}, {venue}, {phone}. */
export function renderTemplate(
  template: string,
  vars: {
    name?: string;
    ref?: string;
    event?: string;
    date?: string;
    venue?: string;
    phone?: string;
  }
): string {
  return template
    .replace(/\{name\}/gi, vars.name ?? "")
    .replace(/\{ref\}/gi, vars.ref ?? "")
    .replace(/\{event\}/gi, vars.event ?? "")
    .replace(/\{date\}/gi, vars.date ?? "")
    .replace(/\{venue\}/gi, vars.venue ?? "")
    .replace(/\{phone\}/gi, vars.phone ?? "");
}
