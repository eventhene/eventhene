/**
 * When the organizer turns off the contact step and a guest has no email, orders still need an
 * email address (the payment provider requires one). We use a reserved, undeliverable address
 * and never try to send mail to it.
 */
const PLACEHOLDER_DOMAIN = "example.com";

export function placeholderEmail(seed: string): string {
  const clean = seed.replace(/[^a-z0-9]/gi, "").slice(0, 24) || "guest";
  return `guest+${clean}@${PLACEHOLDER_DOMAIN}`;
}

export function isPlaceholderEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(`@${PLACEHOLDER_DOMAIN}`) && email.toLowerCase().startsWith("guest+");
}
