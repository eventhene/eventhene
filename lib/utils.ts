import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMinorAmount(minor: number, currency: string): string {
  const value = minor / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: value % 1 === 0 ? 0 : 2
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatDate(date: Date | string, tz?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz
  });
}

export function formatDateShort(date: Date | string, tz?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: tz
  });
}

export function getCountryCurrency(country: string): { currency: string; timezone: string } {
  const map: Record<string, { currency: string; timezone: string }> = {
    GH: { currency: "GHS", timezone: "Africa/Accra" },
    NG: { currency: "NGN", timezone: "Africa/Lagos" },
    KE: { currency: "KES", timezone: "Africa/Nairobi" },
    ZA: { currency: "ZAR", timezone: "Africa/Johannesburg" },
    US: { currency: "USD", timezone: "America/New_York" },
    GB: { currency: "GBP", timezone: "Europe/London" },
    CA: { currency: "CAD", timezone: "America/Toronto" }
  };
  return map[country] ?? { currency: "USD", timezone: "UTC" };
}
