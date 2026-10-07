import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/superadmin",
  "/me",
  "/onboarding",
  "/scan",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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
