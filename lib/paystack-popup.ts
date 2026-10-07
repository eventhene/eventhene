declare global {
  interface Window {
    PaystackPop?: {
      setup(opts: {
        key?: string;
        access_code: string;
        callback: (response: { reference: string; trans: string; status: string }) => void;
        onClose: () => void;
      }): { openIframe: () => void };
    };
  }
}

let scriptLoaded = false;
let scriptLoading: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (scriptLoaded && window.PaystackPop) return Promise.resolve();
  if (scriptLoading) return scriptLoading;

  scriptLoading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Paystack"));
    document.head.appendChild(script);
  });

  return scriptLoading;
}

export async function openPaystackPopup(opts: {
  accessCode: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}) {
  await loadScript();
  if (!window.PaystackPop) throw new Error("Paystack not available");

  const handler = window.PaystackPop.setup({
    access_code: opts.accessCode,
    callback: (response) => opts.onSuccess(response.reference),
    onClose: opts.onClose,
  });
  handler.openIframe();
}
