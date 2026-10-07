"use client";

import { useState, useCallback, useId } from "react";
import { Eye, EyeOff, Check, X, Sparkles, Copy } from "lucide-react";

interface Rule {
  label: string;
  test: (pw: string) => boolean;
}

const RULES: Rule[] = [
  { label: "8+ characters", test: (pw) => pw.length >= 8 },
  { label: "Uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "Number", test: (pw) => /\d/.test(pw) },
  { label: "Symbol", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

const COMMON_PASSWORDS = new Set([
  "password", "12345678", "123456789", "1234567890", "qwerty123",
  "password1", "iloveyou", "sunshine1", "princess1", "football1",
  "letmein12", "welcome1", "monkey123", "dragon123", "master123",
  "abc12345", "trustno1", "baseball1", "shadow12", "michael1",
]);

type Strength = "weak" | "fair" | "good" | "strong";

function scorePassword(pw: string): { strength: Strength; score: number; tip: string } {
  if (!pw) return { strength: "weak", score: 0, tip: "" };

  let score = 0;
  const len = pw.length;

  if (len >= 8) score += 1;
  if (len >= 12) score += 1;
  if (len >= 16) score += 1;
  if (len >= 20) score += 1;

  if (/[a-z]/.test(pw)) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;

  const uniqueChars = new Set(pw).size;
  if (uniqueChars >= 8) score += 1;
  if (uniqueChars >= 12) score += 1;

  const lower = pw.toLowerCase();
  if (COMMON_PASSWORDS.has(lower) || COMMON_PASSWORDS.has(lower.replace(/\d+$/, ""))) {
    score = Math.min(score, 2);
  }

  const repeats = pw.match(/(.)\1{2,}/g);
  if (repeats) score = Math.max(0, score - 1);

  const sequential = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i;
  if (sequential.test(pw)) score = Math.max(0, score - 1);

  let tip = "";
  if (score <= 3) {
    if (len < 12) tip = "Make it longer";
    else if (!/[A-Z]/.test(pw)) tip = "Add an uppercase letter";
    else if (!/\d/.test(pw)) tip = "Add a number";
    else if (!/[^A-Za-z0-9]/.test(pw)) tip = "Add a symbol";
    else tip = "Try a less common phrase";
  } else if (score <= 5) {
    if (len < 12) tip = "A few more characters would help";
    else if (!/[^A-Za-z0-9]/.test(pw)) tip = "A symbol would make it stronger";
    else if (uniqueChars < 8) tip = "Use more varied characters";
    else tip = "Almost there";
  } else if (score <= 7) {
    if (len < 16) tip = "Add another word for extra security";
    else tip = "Looking good";
  }

  let strength: Strength;
  if (score <= 3) strength = "weak";
  else if (score <= 5) strength = "fair";
  else if (score <= 7) strength = "good";
  else strength = "strong";

  return { strength, score: Math.min(score, 10), tip };
}

function generatePassword(): string {
  const charset = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*-_+=";
  const array = new Uint8Array(18);
  crypto.getRandomValues(array);
  let pw = "";
  for (let i = 0; i < 18; i++) {
    pw += charset[array[i] % charset.length];
  }
  if (!/[A-Z]/.test(pw)) pw = pw.slice(0, -3) + "K" + pw.slice(-2);
  if (!/[a-z]/.test(pw)) pw = pw.slice(0, -2) + "m" + pw.slice(-1);
  if (!/\d/.test(pw)) pw = pw.slice(0, -1) + "7";
  if (!/[^A-Za-z0-9]/.test(pw)) pw += "#";
  return pw;
}

const STRENGTH_CONFIG: Record<Strength, { color: string; bg: string; label: string; width: string }> = {
  weak: { color: "var(--crimson)", bg: "rgba(197,48,48,0.1)", label: "Weak", width: "25%" },
  fair: { color: "#D97706", bg: "rgba(217,119,6,0.1)", label: "Fair", width: "50%" },
  good: { color: "#1E6EDB", bg: "rgba(30,110,219,0.1)", label: "Good", width: "75%" },
  strong: { color: "var(--emerald)", bg: "rgba(14,143,107,0.1)", label: "Strong", width: "100%" },
};

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  confirmValue?: string;
  onConfirmChange?: (value: string) => void;
  showRequirements?: boolean;
  showGenerator?: boolean;
  autoComplete?: string;
  confirmAutoComplete?: string;
}

export function PasswordInput({
  value,
  onChange,
  confirmValue,
  onConfirmChange,
  showRequirements = true,
  showGenerator = true,
  autoComplete = "new-password",
  confirmAutoComplete = "new-password",
}: PasswordInputProps) {
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [focused, setFocused] = useState(false);
  const id = useId();

  const { strength, tip } = scorePassword(value);
  const config = STRENGTH_CONFIG[strength];
  const rulesResults = RULES.map((r) => ({ ...r, passed: r.test(value) }));
  const allPassed = rulesResults.every((r) => r.passed);
  const hasInput = value.length > 0;

  const confirmMismatch = confirmValue !== undefined && confirmValue.length > 0 && value !== confirmValue;
  const confirmMatch = confirmValue !== undefined && confirmValue.length > 0 && value === confirmValue;

  const handleGenerate = useCallback(() => {
    const pw = generatePassword();
    onChange(pw);
    if (onConfirmChange) onConfirmChange(pw);
    setShowPw(true);
  }, [onChange, onConfirmChange]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [value]);

  return (
    <div className="space-y-3">
      {/* Password field */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor={`${id}-pw`} className="label mb-0">Password</label>
          {showGenerator && (
            <button
              type="button"
              onClick={handleGenerate}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-muted hover:text-ink transition"
            >
              <Sparkles className="w-3 h-3" />
              Suggest strong password
            </button>
          )}
        </div>
        <div className="relative">
          <input
            id={`${id}-pw`}
            type={showPw ? "text" : "password"}
            required
            minLength={8}
            autoComplete={autoComplete}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="input pr-20"
            placeholder="At least 8 characters"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {hasInput && (
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-black/5 transition"
                title="Copy password"
              >
                {copied ? <Check className="w-4 h-4 text-[color:var(--emerald)]" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-black/5 transition"
              title={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Strength meter */}
      {hasInput && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-black/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: config.width, backgroundColor: config.color }}
              />
            </div>
            <span
              className="text-[11px] font-bold uppercase tracking-wider min-w-[48px] text-right"
              style={{ color: config.color }}
            >
              {config.label}
            </span>
          </div>
          {tip && (
            <p className="text-xs text-ink-muted">{tip}</p>
          )}
        </div>
      )}

      {/* Requirements checklist */}
      {showRequirements && (hasInput || focused) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {rulesResults.map((r) => (
            <div
              key={r.label}
              className="flex items-center gap-1.5 text-[11px] font-medium transition-colors duration-200"
              style={{ color: hasInput ? (r.passed ? "var(--emerald)" : "var(--ink-muted)") : "var(--ink-faint)" }}
            >
              {r.passed ? (
                <Check className="w-3 h-3" strokeWidth={3} />
              ) : (
                <X className="w-3 h-3" strokeWidth={2} />
              )}
              {r.label}
            </div>
          ))}
        </div>
      )}

      {/* Confirm password field */}
      {onConfirmChange !== undefined && (
        <div>
          <label htmlFor={`${id}-confirm`} className="label">Confirm password</label>
          <div className="relative">
            <input
              id={`${id}-confirm`}
              type={showConfirm ? "text" : "password"}
              required
              autoComplete={confirmAutoComplete}
              value={confirmValue || ""}
              onChange={(e) => onConfirmChange(e.target.value)}
              className="input pr-12"
              placeholder="Re-enter your password"
              style={
                confirmMismatch
                  ? { borderColor: "var(--crimson)", boxShadow: "0 0 0 3px rgba(197,48,48,0.1)" }
                  : confirmMatch
                  ? { borderColor: "var(--emerald)", boxShadow: "0 0 0 3px rgba(14,143,107,0.1)" }
                  : undefined
              }
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-black/5 transition"
              title={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmMismatch && (
            <p className="text-xs mt-1.5 font-medium" style={{ color: "var(--crimson)" }}>Passwords do not match</p>
          )}
          {confirmMatch && (
            <p className="flex items-center gap-1 text-xs mt-1.5 font-medium" style={{ color: "var(--emerald)" }}>
              <Check className="w-3 h-3" strokeWidth={3} />
              Passwords match
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export { scorePassword, RULES };
export type { Strength };
