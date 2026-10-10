import { NextResponse, type NextRequest } from "next/server";
import { getAppUrl, isCustomDomain } from "@/lib/app-url";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/superadmin",
  "/me",
  "/onboarding",
  "/scan",
  "/account",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Once a custom domain is live, send visitors on the old *.vercel.app address (for example from
  // old SMS links) to the new domain. Pages only: API calls are never redirected.
  if (process.env.VERCEL_ENV === "production" && isCustomDomain() && (req.method === "GET" || req.method === "HEAD")) {
    const host = req.headers.get("host") || "";
    if (host.endsWith(".vercel.app")) {
      return NextResponse.redirect(`${getAppUrl()}${pathname}${req.nextUrl.search}`, 308);
    }
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isProtected) return NextResponse.next();

  const hasSession = req.cookies.has("eh_session");
  if (!hasSession) {
    console.log("[middleware] no eh_session cookie for", pathname, "- all cookies:", [...req.cookies.getAll().map(c => c.name)]);
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  const forwarded = new Headers(req.headers);
  forwarded.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: forwarded } });
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
