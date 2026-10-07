"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

interface SignOutButtonProps {
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function SignOutButton({ className, showIcon = true, children }: SignOutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    setLoading(true);
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleSignOut} disabled={loading} className={className}>
      {loading ? (
        <Loader2 className="w-[18px] h-[18px] animate-spin" />
      ) : showIcon ? (
        <LogOut className="w-[18px] h-[18px]" />
      ) : null}
      {children || "Sign out"}
    </button>
  );
}
