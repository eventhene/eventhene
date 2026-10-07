// Custom session system using signed JWTs stored in httpOnly cookies.
// No Clerk, no third-party auth lock-in. Full control.

import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import crypto from "crypto";
import { db } from "@/lib/db";

const COOKIE_NAME = "eh_session";
const SESSION_DAYS = 30;

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || process.env.QR_SIGNING_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error(
      "AUTH_SECRET is missing. Set a long random string in your env (24+ chars)."
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  uid: string;
  sid: string;
  iat?: number;
  exp?: number;
}

export async function createSession(userId: string, meta: { ip?: string; userAgent?: string }) {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  const session = await db.session.create({
    data: {
      userId,
      tokenHash,
      ip: meta.ip,
      userAgent: meta.userAgent,
      expiresAt,
    },
  });

  const jwt = await new SignJWT({ uid: userId, sid: session.id, t: token })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };

  try { cookies().set(COOKIE_NAME, jwt, cookieOptions); } catch {}

  return { session, jwt, cookieName: COOKIE_NAME, cookieOptions };
}

export async function destroySession() {
  const jar = cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (raw) {
    try {
      const { payload } = await jwtVerify(raw, getSecret());
      const sid = (payload as any).sid as string | undefined;
      if (sid) await db.session.delete({ where: { id: sid } }).catch(() => {});
    } catch {}
  }
  jar.delete(COOKIE_NAME);
}

async function verifySessionJwt(raw: string) {
  try {
    const { payload } = await jwtVerify(raw, getSecret());
    const uid = (payload as any).uid as string;
    const sid = (payload as any).sid as string;
    const token = (payload as any).t as string;
    if (!uid || !sid || !token) return null;

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const session = await db.session.findUnique({
      where: { id: sid },
      include: { user: true },
    });
    if (!session) {
      console.error("[session] DB lookup failed: no session found for sid", sid);
      return null;
    }
    if (session.tokenHash !== tokenHash) {
      console.error("[session] Token hash mismatch for sid", sid);
      return null;
    }
    if (session.expiresAt < new Date()) {
      await db.session.delete({ where: { id: sid } }).catch(() => {});
      return null;
    }
    return { user: session.user, session };
  } catch (err) {
    console.error("[session] verifySessionJwt error:", err);
    return null;
  }
}

function extractCookieFromHeader(headerValue: string): string | undefined {
  const match = headerValue.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
  return match ? match[1] : undefined;
}

export async function readSession() {
  let raw: string | undefined;

  try { raw = cookies().get(COOKIE_NAME)?.value; } catch {}

  if (!raw) {
    try {
      const cookieHeader = headers().get("cookie") || "";
      raw = extractCookieFromHeader(cookieHeader);
    } catch {}
  }

  if (!raw) {
    console.error("[session] readSession: no cookie found via cookies() or headers()");
    return null;
  }
  return verifySessionJwt(raw);
}

export async function readSessionFromRequest(req: {
  cookies: { get(name: string): { value: string } | undefined };
  headers: { get(name: string): string | null };
}) {
  let raw = req.cookies.get(COOKIE_NAME)?.value;

  if (!raw) {
    try {
      const cookieHeader = req.headers.get("cookie") || "";
      raw = extractCookieFromHeader(cookieHeader);
    } catch {}
  }

  if (!raw) {
    try { raw = cookies().get(COOKIE_NAME)?.value; } catch {}
  }

  if (!raw) {
    try {
      const cookieHeader = headers().get("cookie") || "";
      raw = extractCookieFromHeader(cookieHeader);
    } catch {}
  }

  if (!raw) {
    console.error("[session] readSessionFromRequest: no cookie found via any method");
    return null;
  }
  return verifySessionJwt(raw);
}
