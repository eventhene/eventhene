"use client";

import { useState } from "react";
import { Loader2, CreditCard, Zap } from "lucide-react";

const PACKAGES = [
  { id: "100",  credits: 100,  price: "GHS 10",  perCredit: "GHS 0.10", popular: false },
  { id: "500",  credits: 500,  price: "GHS 45",  perCredit: "GHS 0.09", popular: true },
  { id: "1000", credits: 1000, price: "GHS 80",  perCredit: "GHS 0.08", popular: false },
  { id: "5000", credits: 5000, price: "GHS 350", perCredit: "GHS 0.07", popular: false },
];

export function SmsTopUp() {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePurchase() {
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/sms/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initialize payment.");
      window.location.href = data.authorization_url;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {PACKAGES.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => setSelected(pkg.id)}
            className={`relative rounded-xl p-4 text-left transition border ${
              selected === pkg.id
                ? "border-accent bg-accent/10"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
          >
            {pkg.popular && (
              <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-accent text-black">
                Best value
              </span>
            )}
            <p className="font-display text-2xl text-white">{pkg.credits.toLocaleString()}</p>
            <p className="text-xs text-white/40 mt-0.5">credits</p>
            <p className="text-sm font-bold text-accent mt-2">{pkg.price}</p>
            <p className="text-[10px] text-white/30">{pkg.perCredit}/credit</p>
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={handlePurchase}
        disabled={!selected || loading}
        className="btn-gold btn-md w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting to payment...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            {selected ? `Buy ${PACKAGES.find((p) => p.id === selected)?.credits.toLocaleString()} credits` : "Select a package"}
          </>
        )}
      </button>

      <p className="text-[11px] text-white/30 text-center flex items-center justify-center gap-1">
        <Zap className="w-3 h-3" />
        Powered by Paystack - instant delivery after payment
      </p>
    </div>
  );
}
