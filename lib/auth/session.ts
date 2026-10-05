// Custom session system using signed JWTs stored in httpOnly cookies.
// No Clerk, no third-party auth lock-in. Full control.

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
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

  cookies().set(COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return session;
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

export async function readSession() {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;
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
    if (!session) return null;
    if (session.tokenHash !== tokenHash) return null;
    if (session.expiresAt < new Date()) {
      await db.session.delete({ where: { id: sid } }).catch(() => {});
      return null;
    }
    return { user: session.user, session };
  } catch {
    return null;
  }
}
