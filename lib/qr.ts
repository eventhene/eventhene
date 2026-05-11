import crypto from "crypto";
import QRCode from "qrcode";

function getSecret(): string {
  const s = process.env.QR_SIGNING_SECRET;
  if (!s || s.length < 16) {
    throw new Error("QR_SIGNING_SECRET is missing or too short (>=32 chars recommended).");
  }
  return s;
}

/** Generate a 32-byte url-safe random token and its SHA-256 hash. */
export function generateTicketToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

/** Build the QR payload string that gets encoded into the QR image. */
export function buildQrPayload(ticketToken: string, eventId: string): string {
  const payload = { tid: ticketToken, eid: eventId, v: 1, iat: Date.now() };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${sig}`;
}

export type QrVerifyResult =
  | { ok: true; tid: string; eid: string; iat: number }
  | { ok: false; reason: "MALFORMED" | "INVALID_SIGNATURE" | "BAD_VERSION" | "BAD_PAYLOAD" | "EXPIRED" };

/** Verify a scanned QR payload string. Constant-time signature comparison. */
export function verifyQrPayload(qr: string): QrVerifyResult {
  const parts = qr.split(".");
  if (parts.length !== 2) return { ok: false, reason: "MALFORMED" };
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return { ok: false, reason: "MALFORMED" };

  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(payloadB64)
    .digest("base64url");

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: "INVALID_SIGNATURE" };
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (payload.v !== 1) return { ok: false, reason: "BAD_VERSION" };
    if (!payload.tid || !payload.eid) return { ok: false, reason: "BAD_PAYLOAD" };
    // reject payloads older than 2 years
    if (Date.now() - payload.iat > 1000 * 60 * 60 * 24 * 730) {
      return { ok: false, reason: "EXPIRED" };
    }
    return { ok: true, tid: payload.tid, eid: payload.eid, iat: payload.iat };
  } catch {
    return { ok: false, reason: "BAD_PAYLOAD" };
  }
}

/** Render a QR as a PNG data URL. */
export async function qrToDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 512,
    color: { dark: "#0F0E13", light: "#FFFFFF" }
  });
}

/** Render a QR as a Buffer (for PDF embedding). */
export async function qrToBuffer(payload: string): Promise<Buffer> {
  return QRCode.toBuffer(payload, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 512,
    color: { dark: "#0F0E13", light: "#FFFFFF" }
  });
}

/** Hash a raw token for DB lookup. */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
