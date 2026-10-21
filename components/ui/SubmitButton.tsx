"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

type Phase = "idle" | "running" | "done";

/**
 * Submit button with a travelling accent edge.
 *
 * While the request is in flight an accent arc orbits the border, starting at
 * the top centre. On success the rim completes, the button pops once, and the
 * label flips to a confirmation before settling back.
 *
 * The halo is a sibling behind the button rather than a masked pseudo-element:
 * the button's own opaque fill covers the middle so only a rim shows, which
 * avoids mask-composite entirely (autoprefixer mangles it).
 *
 * Drive it with `loading` and `success`; everything else is an ordinary button.
 */
export function SubmitButton({
  loading = false,
  success = false,
  doneLabel = "Done",
  loadingLabel,
  children,
  className = "btn-gold btn-xl",
  wrapClassName = "",
  resetAfter = 1800,
  ...rest
}: {
  loading?: boolean;
  success?: boolean;
  doneLabel?: string;
  loadingLabel?: React.ReactNode;
  wrapClassName?: string;
  resetAfter?: number;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [phase, setPhase] = useState<Phase>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (success) setPhase("done");
    else if (loading) setPhase("running");
    else setPhase("idle");
  }, [loading, success]);

  // Settle back to the normal label once the confirmation has been seen.
  useEffect(() => {
    if (phase !== "done" || resetAfter <= 0) return;
    timer.current = setTimeout(() => setPhase("idle"), resetAfter);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [phase, resetAfter]);

  return (
    <span className={`eh-submit-wrap ${wrapClassName}`} data-phase={phase}>
      {phase !== "idle" && <span className="eh-submit-halo" aria-hidden />}
      <button {...rest} disabled={rest.disabled || loading} className={`eh-submit ${className}`}>
        <span className="eh-submit-label">
          {phase === "done" ? (
            <>
              <Check className="h-5 w-5" />
              {doneLabel}
            </>
          ) : phase === "running" ? (
            (loadingLabel ?? children)
          ) : (
            children
          )}
        </span>
      </button>
    </span>
  );
}
