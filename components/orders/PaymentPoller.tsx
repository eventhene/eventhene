"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function PaymentPoller({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (failed) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/verify`);
        const data = await res.json();
        if (data.status === "PAID") {
          clearInterval(timer);
          router.refresh();
        } else if (data.status === "FAILED" || data.status === "CANCELLED") {
          clearInterval(timer);
          setFailed(true);
        }
        setAttempts((a) => a + 1);
      } catch {}
    }, 4000);

    return () => clearInterval(timer);
  }, [orderId, router, failed]);

  if (failed) {
    return (
      <div className="card-glass rounded-2xl p-12 text-center">
        <h1 className="h-section mb-3">Payment didn't go through.</h1>
        <p className="text-ink-muted">No charge was made. Try again from the event page.</p>
      </div>
    );
  }

  return (
    <div className="card-glass rounded-2xl p-12 text-center">
      <Loader2 className="w-10 h-10 animate-spin text-accent mx-auto" />
      <h1 className="h-section mt-6 mb-2">Confirming payment...</h1>
      <p className="text-ink-muted">
        We're verifying your payment with your bank or Mobile Money provider. This usually takes a few seconds.
      </p>
      <p className="text-xs text-ink-muted mt-6 font-mono">Reference: {orderId}</p>
      {attempts > 5 && (
        <p className="text-xs text-white/40 mt-4">
          Still waiting - this can take up to a minute for Mobile Money.
        </p>
      )}
    </div>
  );
}
