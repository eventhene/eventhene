import crypto from "crypto";

const BASE = "https://api.paystack.co";

function getKey(): string {
  const k = process.env.PAYSTACK_SECRET_KEY;
  if (!k) throw new Error("PAYSTACK_SECRET_KEY missing");
  return k;
}

async function call<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    },
    cache: "no-store"
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status === false) {
    throw new Error(`paystack_${res.status}: ${json.message ?? "request failed"}`);
  }
  return json as T;
}

export const paystack = {
  async initialize(opts: {
    email: string;
    amountMinor: number;
    currency: string;
    reference: string;
    callbackUrl: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ authorization_url: string; access_code: string; reference: string }> {
    const res = await call<{ data: any }>("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        email: opts.email,
        amount: opts.amountMinor,
        currency: opts.currency,
        reference: opts.reference,
        callback_url: opts.callbackUrl,
        metadata: opts.metadata
      })
    });
    return res.data;
  },

  async verify(reference: string): Promise<{ status: string; amount: number; currency: string; reference: string; id: number }> {
    const res = await call<{ data: any }>(`/transaction/verify/${encodeURIComponent(reference)}`);
    return res.data;
  },

  verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
    if (!signature) return false;
    const expected = crypto
      .createHmac("sha512", getKey())
      .update(rawBody)
      .digest("hex");
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected, "hex"),
        Buffer.from(signature, "hex")
      );
    } catch {
      return false;
    }
  }
};
