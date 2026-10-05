// Hubtel SMS integration.
// Docs: https://developers.hubtel.com/reference/sendmessage
//
// GET https://sms.hubtel.com/v1/messages/send
//   ?clientid=...&clientsecret=...&from=...&to=...&content=...
// All credentials read from env, never hardcoded.

import { normalizeGhPhone } from "./phone";
import { sanitizeSmsContent } from "./sanitize";

const BASE = "https://sms.hubtel.com/v1/messages/send";

export interface HubtelCreds {
  id: string;
  secret: string;
}

export interface HubtelResult {
  ok: boolean;
  to: string;
  messageId?: string;
  rate?: number;
  balance?: number;
  error?: string;
  status?: number;
}

export function getHubtelCreds(): HubtelCreds | null {
  const id = process.env.HUBTEL_CLIENT_ID?.trim();
  const secret = process.env.HUBTEL_CLIENT_SECRET?.trim();
  if (!id || !secret) return null;
  return { id, secret };
}

export function getPlatformSenderId(): string {
  // Default fallback used when an organizer has no approved custom Sender ID.
  const raw = process.env.HUBTEL_SENDER_ID || "EventHene";
  return raw.replace(/[^A-Za-z0-9]/g, "").slice(0, 11) || "EventHene";
}

/**
 * Send one SMS via Hubtel.
 * Never throws. Always returns a HubtelResult with `ok` + `to` set.
 */
export async function sendSMS(
  to: string,
  content: string,
  senderId?: string
): Promise<HubtelResult> {
  const normalized = normalizeGhPhone(to);
  if (!normalized) {
    return { ok: false, to, error: "invalid_phone" };
  }
  const safeContent = sanitizeSmsContent(content);
  if (!safeContent) {
    return { ok: false, to: normalized, error: "empty_content" };
  }
  const from = (senderId || getPlatformSenderId()).replace(/[^A-Za-z0-9]/g, "").slice(0, 11);
  if (!from) {
    return { ok: false, to: normalized, error: "invalid_sender" };
  }

  const creds = getHubtelCreds();
  if (!creds) {
    return { ok: false, to: normalized, error: "hubtel_not_configured" };
  }

  const url = new URL(BASE);
  url.searchParams.set("clientid", creds.id);
  url.searchParams.set("clientsecret", creds.secret);
  url.searchParams.set("from", from);
  url.searchParams.set("to", normalized);
  url.searchParams.set("content", safeContent);

  try {
    const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
    const text = await res.text();
    let body: any = {};
    try { body = JSON.parse(text); } catch { /* non-JSON */ }

    // Hubtel success envelope: { status: 0, messageId, rate, balance, ... }
    const providerStatus = typeof body.status === "number" ? body.status : -1;
    const ok = res.ok && (providerStatus === 0 || providerStatus === 1);

    return {
      ok,
      to: normalized,
      status: res.status,
      messageId: body.messageId ?? body.MessageId,
      rate: body.rate,
      balance: body.balance,
      error: ok ? undefined : (body.statusDescription || body.Message || text.slice(0, 200) || `http_${res.status}`),
    };
  } catch (e: any) {
    return { ok: false, to: normalized, error: e?.message || "network_error" };
  }
}

/** Send sequentially. Simple, deterministic, respects provider rate limits. */
export async function sendSMSBatch(
  recipients: Array<{ to: string; content: string }>,
  senderId?: string,
  opts: { delayMs?: number } = {}
): Promise<HubtelResult[]> {
  const delay = opts.delayMs ?? 60;
  const results: HubtelResult[] = [];
  for (const r of recipients) {
    results.push(await sendSMS(r.to, r.content, senderId));
    if (delay) await new Promise((res) => setTimeout(res, delay));
  }
  return results;
}

// Re-exports for callers
export { normalizeGhPhone } from "./phone";
export { sanitizeSmsContent, renderTemplate } from "./sanitize";
