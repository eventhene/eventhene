declare global {
  interface Window {
    PaystackPop?: new () => {
      resumeTransaction(
        accessCode: string,
        callbacks?: {
          onSuccess?: (tx: { reference: string; status?: string }) => void;
          onCancel?: () => void;
          onError?: (err: { message?: string }) => void;
        }
      ): void;
    };
  }
}

let scriptLoading: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Browser only"));
  if (window.PaystackPop) return Promise.resolve();
  if (scriptLoading) return scriptLoading;

  scriptLoading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoading = null;
      reject(new Error("Failed to load Paystack. Check your connection and try again."));
    };
    document.head.appendChild(script);
  });

  return scriptLoading;
}

export async function openPaystackPopup(opts: {
  accessCode: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
  onError?: (message: string) => void;
}) {
  await loadScript();
  if (!window.PaystackPop) throw new Error("Paystack not available");

  const popup = new window.PaystackPop();
  popup.resumeTransaction(opts.accessCode, {
    onSuccess: (tx) => opts.onSuccess(tx.reference),
    onCancel: opts.onClose,
    onError: (err) => {
      opts.onError?.(err?.message || "Payment could not be started.");
      opts.onClose();
    },
  });
}
