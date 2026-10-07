/**
 * Single source of truth for the site's public address.
 *
 * Resolution order (first match wins):
 *  1. APP_URL                         explicit override (set this only if you need to force it)
 *  2. VERCEL_PROJECT_PRODUCTION_URL   Vercel sets this to your PRIMARY production domain, so adding
 *                                     a domain in Vercel and making it primary is enough
 *  3. NEXT_PUBLIC_APP_URL             the old manual setting (still works)
 *  4. VERCEL_URL / localhost
 *
 * Everything that builds a link (emails, SMS, payment callbacks, invites, metadata) uses this,
 * and the email sender address is derived from it. Pure functions, safe to use in middleware.
 */

const FALLBACK_BRAND_DOMAIN = "eventhene.com";

function clean(url: string): string {
  const u = url.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export function getAppUrl(): string {
  const explicit = process.env.APP_URL?.trim();
  if (explicit) return clean(explicit);

  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (process.env.VERCEL_ENV === "production" && prod) return clean(prod);

  const pub = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (pub) return clean(pub);

  const preview = process.env.VERCEL_URL?.trim();
  if (preview) return clean(preview);

  return "http://localhost:3000";
}

export function getAppHost(): string {
  try {
    return new URL(getAppUrl()).host;
  } catch {
    return "localhost:3000";
  }
}

/** True once a real custom domain (not *.vercel.app, not localhost) is active. */
export function isCustomDomain(): boolean {
  const host = getAppHost();
  return !host.endsWith(".vercel.app") && !host.startsWith("localhost") && !host.startsWith("127.");
}

/** example.com for www.example.com / example.com. */
export function getApexDomain(): string {
  return getAppHost().replace(/^www\./i, "").replace(/:\d+$/, "");
}

/** Domain used for addresses like support@..., the real one once active, else the placeholder brand domain. */
export function getBrandDomain(): string {
  return isCustomDomain() ? getApexDomain() : FALLBACK_BRAND_DOMAIN;
}

export function brandEmail(prefix: string): string {
  return `${prefix}@${getBrandDomain()}`;
}
