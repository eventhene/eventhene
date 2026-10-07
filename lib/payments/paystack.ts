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
    subaccount?: string;
    bearer?: string;
    transactionChargeMinor?: number;
  }): Promise<{ authorization_url: string; access_code: string; reference: string }> {
    const payload: Record<string, unknown> = {
      email: opts.email,
      amount: opts.amountMinor,
      currency: opts.currency,
      reference: opts.reference,
      callback_url: opts.callbackUrl,
      metadata: opts.metadata,
    };
    if (opts.subaccount) {
      payload.subaccount = opts.subaccount;
      payload.bearer = opts.bearer || "account";
      // Flat amount kept by the platform (main account); the rest goes to the organizer subaccount.
      if (typeof opts.transactionChargeMinor === "number") {
        payload.transaction_charge = Math.max(0, Math.round(opts.transactionChargeMinor));
      }
    }
    const res = await call<{ data: any }>("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async verify(reference: string): Promise<{ status: string; amount: number; currency: string; reference: string; id: number }> {
    const res = await call<{ data: any }>(`/transaction/verify/${encodeURIComponent(reference)}`);
    return res.data;
  },

  async createSubaccount(opts: {
    businessName: string;
    bankCode: string;
    accountNumber: string;
    percentageCharge: number;
  }): Promise<{ subaccount_code: string; id: number }> {
    const res = await call<{ data: any }>("/subaccount", {
      method: "POST",
      body: JSON.stringify({
        business_name: opts.businessName,
        bank_code: opts.bankCode,
        account_number: opts.accountNumber,
        percentage_charge: opts.percentageCharge,
        settlement_bank: opts.bankCode,
      }),
    });
    return res.data;
  },

  /** Paystack cannot delete subaccounts; deactivating stops them being used. */
  async deactivateSubaccount(code: string): Promise<void> {
    await call(`/subaccount/${encodeURIComponent(code)}`, {
      method: "PUT",
      body: JSON.stringify({ active: false }),
    });
  },

  async listBanks(country: string = "ghana"): Promise<Array<{ name: string; code: string }>> {
    const res = await call<{ data: any[] }>(`/bank?country=${country}&perPage=100`);
    return res.data.map((b: any) => ({ name: b.name, code: b.code }));
  },

  async resolveAccount(accountNumber: string, bankCode: string): Promise<{ account_name: string; account_number: string }> {
    const res = await call<{ data: any }>(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);
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
