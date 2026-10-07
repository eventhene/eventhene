"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle, Building2, AlertCircle } from "lucide-react";

interface Bank {
  name: string;
  code: string;
}

interface Props {
  currentBank?: string | null;
  currentAccount?: string | null;
  currentName?: string | null;
  isVerified?: boolean;
  subaccount?: string | null;
}

export function PayoutForm({ currentBank, currentAccount, currentName, isVerified, subaccount }: Props) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState(currentAccount || "");
  const [accountName, setAccountName] = useState(currentName || "");
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resolved, setResolved] = useState(!!currentName);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetch("/api/banks")
      .then((r) => r.json())
      .then((d) => {
        setBanks(d.banks || []);
        if (currentBank) {
          const match = (d.banks || []).find((b: Bank) => b.name === currentBank);
          if (match) setBankCode(match.code);
        }
      })
      .catch(() => {});
  }, [currentBank]);

  async function resolveAccount() {
    if (!bankCode || accountNumber.length < 5) return;
    setResolving(true);
    setError("");
    setAccountName("");
    setResolved(false);
    try {
      const res = await fetch("/api/settings/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve", accountNumber, bankCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not verify account");
      setAccountName(data.accountName);
      setResolved(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setResolving(false);
    }
  }

  async function handleSave() {
    if (!resolved || !accountName) return;
    setSaving(true);
    setError("");
    try {
      const bankName = banks.find((b) => b.code === bankCode)?.name || bankCode;
      const res = await fetch("/api/settings/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", accountNumber, bankCode, bankName, accountName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setSuccess(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (isVerified && subaccount && !success && !editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircle className="w-5 h-5" />
          <span className="font-bold text-sm">Payout account connected</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-white/40 text-xs">Bank</p>
            <p className="text-white">{currentBank}</p>
          </div>
          <div>
            <p className="text-white/40 text-xs">Account</p>
            <p className="text-white font-mono">
              {"*".repeat(Math.max(0, (currentAccount?.length || 0) - 4))}
              {currentAccount?.slice(-4)}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-white/40 text-xs">Account name</p>
            <p className="text-white">{currentName}</p>
          </div>
        </div>
        <p className="text-xs text-white/30">
          Revenue from paid events is settled to this account automatically (minus platform fees).
        </p>
        <button
          type="button"
          onClick={() => { setEditing(true); setResolved(false); setAccountName(""); setAccountNumber(""); setBankCode(""); }}
          className="text-sm text-accent hover:text-accent/80 underline underline-offset-2"
        >
          Change payout account
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center py-6 space-y-3">
        <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
        <p className="text-white font-bold text-lg">Payout account saved!</p>
        <p className="text-white/50 text-sm">Revenue from paid events will settle to this account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label text-white/60">Bank</label>
        <select
          value={bankCode}
          onChange={(e) => { setBankCode(e.target.value); setResolved(false); setAccountName(""); }}
          className="input text-white w-full"
        >
          <option value="">Select your bank</option>
          {banks.map((b) => (
            <option key={b.code} value={b.code}>{b.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label text-white/60">Account number</label>
        <input
          type="text"
          value={accountNumber}
          onChange={(e) => { setAccountNumber(e.target.value); setResolved(false); setAccountName(""); }}
          placeholder="e.g. 0123456789"
          className="input text-white w-full"
          maxLength={20}
        />
      </div>

      {!resolved && (
        <button
          type="button"
          onClick={resolveAccount}
          disabled={resolving || !bankCode || accountNumber.length < 5}
          className="btn-gold btn-sm flex items-center gap-2"
        >
          {resolving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <Building2 className="w-4 h-4" />
              Verify account
            </>
          )}
        </button>
      )}

      {resolved && accountName && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold mb-1">
            <CheckCircle className="w-4 h-4" />
            Account verified
          </div>
          <p className="text-white text-sm">{accountName}</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {resolved && accountName && (
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-gold btn-md w-full flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Setting up payout...
            </>
          ) : (
            "Save payout details"
          )}
        </button>
      )}

      <p className="text-[11px] text-white/30">
        Your bank details are used to create a Paystack subaccount.
        Revenue from paid events settles directly to your bank (minus platform fees).
      </p>
    </div>
  );
}
