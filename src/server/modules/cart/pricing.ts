/**
 * Pure pricing rules for promotions and totals. No I/O, so every branch is unit-tested.
 * All amounts are integer minor units (USD cents).
 */

export type PromoKind = "PERCENT" | "FIXED" | "SHIPPING";

export type PromoState = {
  code: string;
  kind: PromoKind;
  value: number;
  minSubtotalMinor: number;
  description: string;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  usedCount: number;
};

export type PromoRejection = "inactive" | "not_started" | "expired" | "exhausted" | "min_subtotal";

export type PromoEvaluation = { applicable: true } | { applicable: false; reason: PromoRejection };

export const PROMO_REJECTION_MESSAGES: Record<PromoRejection, string> = {
  inactive: "This code is no longer active.",
  not_started: "This code is not active yet.",
  expired: "This code has expired.",
  exhausted: "This code has already been used up.",
  min_subtotal: "Add more to your bag to use this code.",
};

export function evaluatePromo(
  promo: PromoState,
  subtotalMinor: number,
  now: Date,
): PromoEvaluation {
  if (!promo.isActive) return { applicable: false, reason: "inactive" };
  if (promo.startsAt && now < promo.startsAt) return { applicable: false, reason: "not_started" };
  if (promo.endsAt && now > promo.endsAt) return { applicable: false, reason: "expired" };
  if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
    return { applicable: false, reason: "exhausted" };
  }
  if (subtotalMinor < promo.minSubtotalMinor) return { applicable: false, reason: "min_subtotal" };
  return { applicable: true };
}

export type Totals = {
  subtotalMinor: number;
  discountMinor: number;
  shippingMinor: number;
  totalMinor: number;
  promoRejection: PromoRejection | null;
};

export type TotalsInput = {
  subtotalMinor: number;
  shippingMinor: number;
  promo: PromoState | null;
  now: Date;
};

/** Discount never exceeds the amount it applies to, so totals are never negative. */
export function computeDiscount(
  promo: PromoState,
  subtotalMinor: number,
  shippingMinor: number,
): number {
  switch (promo.kind) {
    case "PERCENT":
      return Math.min(subtotalMinor, Math.floor((subtotalMinor * promo.value) / 100));
    case "FIXED":
      return Math.min(subtotalMinor, promo.value);
    case "SHIPPING":
      return shippingMinor;
  }
}

export function computeTotals(input: TotalsInput): Totals {
  const { subtotalMinor, shippingMinor, promo, now } = input;
  if (!promo) {
    return {
      subtotalMinor,
      discountMinor: 0,
      shippingMinor,
      totalMinor: subtotalMinor + shippingMinor,
      promoRejection: null,
    };
  }
  const evaluation = evaluatePromo(promo, subtotalMinor, now);
  if (!evaluation.applicable) {
    return {
      subtotalMinor,
      discountMinor: 0,
      shippingMinor,
      totalMinor: subtotalMinor + shippingMinor,
      promoRejection: evaluation.reason,
    };
  }
  const discountMinor = computeDiscount(promo, subtotalMinor, shippingMinor);
  return {
    subtotalMinor,
    discountMinor,
    shippingMinor,
    totalMinor: subtotalMinor + shippingMinor - discountMinor,
    promoRejection: null,
  };
}

export const normalisePromoCode = (code: string): string => code.trim().toUpperCase();
