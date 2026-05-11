/**
 * EventHene fee math.
 * All amounts in minor units (pesewas for GHS, kobo for NGN, cents for USD).
 */

export const PLATFORM_FEE_RATE = 0.05;

/**
 * Paystack processor fee per country.
 * Source: paystack.com/pricing (approx — re-check before launch).
 */
export function processorFeeMinor(amountMinor: number, country: string): number {
  switch (country) {
    case "GH":
      // 1.95% capped at GHS 10 (1000 pesewas)
      return Math.min(Math.round(amountMinor * 0.0195), 1000);
    case "NG":
      // 1.5% + ₦100 above ₦2,500; capped at ₦2,000
      const base = Math.round(amountMinor * 0.015);
      const flat = amountMinor >= 2500_00 ? 100_00 : 0;
      return Math.min(base + flat, 2000_00);
    case "KE":
      return Math.round(amountMinor * 0.029);
    case "ZA":
      return Math.round(amountMinor * 0.029);
    default:
      // Stripe default for diaspora/USD
      return Math.round(amountMinor * 0.029) + 30;
  }
}

export interface OrderTotals {
  subtotalMinor: number;
  platformFeeMinor: number;
  processorFeeMinor: number;
  totalMinor: number;
  organizerNetMinor: number;
}

export function computeOrderTotals(opts: {
  subtotalMinor: number;
  country: string;
  buyerPaysFee: boolean;
}): OrderTotals {
  const { subtotalMinor, country, buyerPaysFee } = opts;
  const platformFee = Math.round(subtotalMinor * PLATFORM_FEE_RATE);

  if (buyerPaysFee) {
    const processorBase = subtotalMinor + platformFee;
    const processor = processorFeeMinor(processorBase, country);
    return {
      subtotalMinor,
      platformFeeMinor: platformFee,
      processorFeeMinor: processor,
      totalMinor: subtotalMinor + platformFee + processor,
      organizerNetMinor: subtotalMinor
    };
  } else {
    const processor = processorFeeMinor(subtotalMinor, country);
    return {
      subtotalMinor,
      platformFeeMinor: platformFee,
      processorFeeMinor: processor,
      totalMinor: subtotalMinor,
      organizerNetMinor: subtotalMinor - platformFee - processor
    };
  }
}
