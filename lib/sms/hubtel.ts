// Hubtel SMS integration.
// Docs: https://developers.hubtel.com/reference/sendmessage
//
// Hubtel uses HTTP Basic auth with Client ID + Client Secret.
// Endpoint: https://sms.hubtel.com/v1/messages/send

const BASE = "https://smsc.hubtel.com/v1/messages/send";

export interface HubtelSendResult {
  ok: boolean;
  messageId?: string;
  rate?: number;
  balance?: number;
  errorText?: string;
  status?: number;
}

export interface SendSmsInput {
  to: string;         // E.164 preferred, e.g. +233244123456
  from: string;       // Sender ID, e.g. "EVENTHENE" or your approved short code
  content: string;
}

function getCreds(): { id: string; secret: string } | null {
  const id = process.env.HUBTEL_CLIENT_ID;
  const secret = process.env.HUBTEL_CLIENT_SECRET;
  if (!id || !secret) return null;
  return { id, secret };
}

function basicAuth(id: string, secret: string): string {
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

export function normalizeGhPhone(raw: string): string {
  // Return E.164 (+233…) when input looks like a Ghana number; otherwise just strip non-digits.
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return "+" + digits.slice(2);
  if (digits.startsWith("233")) return "+" + digits;
  if (digits.startsWith("0") && digits.length === 10) return "+233" + digits.slice(1);
  // Fallback: assume local Ghana if 9 digits
  if (digits.length === 9) return "+233" + digits;
  return digits;
}

/** Send one SMS via Hubtel. Returns parsed result (never throws for provider errors). */
export async function sendHubtelSms({ to, from, content }: SendSmsInput): Promise<HubtelSendResult> {
  const creds = getCreds();
  if (!creds) {
    return { ok: false, errorText: "HUBTEL_CLIENT_ID / HUBTEL_CLIENT_SECRET missing" };
  }
  const url = new URL(BASE);
  url.searchParams.set("clientsecret", creds.secret);
  url.searchParams.set("clientid", creds.id);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  url.searchParams.set("content", content);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Authorization: basicAuth(creds.id, creds.secret) },
      cache: "no-store",
    });
    const text = await res.text();
    let json: any = {};
    try { json = JSON.parse(text); } catch { /* non-JSON */ }

    // Hubtel typical success: { status: 0, messageId, rate, ...}
    const status = typeof json.status === "number" ? json.status : -1;
    const ok = res.ok && (status === 0 || status === 1);
    return {
      ok,
      status: res.status,
      messageId: json.messageId || json.MessageId,
      rate: json.rate,
      balance: json.balance,
      errorText: ok ? undefined : (json.statusDescription || json.Message || text.slice(0, 200)),
    };
  } catch (e: any) {
    return { ok: false, errorText: e?.message || "network_error" };
  }
}

/**
 * Send many messages with light throttling.
 * Returns per-recipient result in the same order as `inputs`.
 */
export async function sendHubtelBatch(
  inputs: SendSmsInput[],
  opts: { concurrency?: number; delayMs?: number } = {}
): Promise<HubtelSendResult[]> {
  const concurrency = opts.concurrency ?? 4;
  const delay = opts.delayMs ?? 60;
  const results: HubtelSendResult[] = new Array(inputs.length);
  let idx = 0;
  async function worker() {
    while (idx < inputs.length) {
      const i = idx++;
      results[i] = await sendHubtelSms(inputs[i]);
      if (delay) await new Promise((r) => setTimeout(r, delay));
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, inputs.length) }, worker));
  return results;
}

/** Simple personalization: swap {name}, {ref}, {event}, {date}, {venue}. */
export function renderTemplate(
  template: string,
  vars: { name?: string; ref?: string; event?: string; date?: string; venue?: string }
): string {
  return template
    .replace(/\{name\}/gi, vars.name ?? "")
    .replace(/\{ref\}/gi, vars.ref ?? "")
    .replace(/\{event\}/gi, vars.event ?? "")
    .replace(/\{date\}/gi, vars.date ?? "")
    .replace(/\{venue\}/gi, vars.venue ?? "");
}
