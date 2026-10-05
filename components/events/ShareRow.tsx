"use client";

import { useState } from "react";

export function ShareRow({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent(url);
  const txt = encodeURIComponent(title);

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const buttons = [
    { label: "WhatsApp", href: `https://wa.me/?text=${txt}%20${enc}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc}` },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${txt}&url=${enc}` },
    { label: "Telegram", href: `https://t.me/share/url?url=${enc}&text=${txt}` },
    { label: "Email", href: `mailto:?subject=${txt}&body=${enc}` },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button onClick={copyLink} className="btn-primary btn-sm">
        {copied ? "✓ Copied" : "Copy link"}
      </button>
      {buttons.map((b) => (
        <a
          key={b.label}
          href={b.href}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost btn-sm"
        >
          {b.label}
        </a>
      ))}
    </div>
  );
}
