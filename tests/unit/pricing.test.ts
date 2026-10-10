import { describe, expect, it } from "vitest";
import {
  computeDiscount,
  computeTotals,
  evaluatePromo,
  normalisePromoCode,
  type PromoState,
} from "@/server/modules/cart/pricing";

const NOW = new Date("2026-10-10T12:00:00Z");

const promo = (overrides: Partial<PromoState> = {}): PromoState => ({
  code: "TEST",
  kind: "PERCENT",
  value: 10,
  minSubtotalMinor: 0,
  description: "test",
  isActive: true,
  startsAt: null,
  endsAt: null,
  usageLimit: null,
  usedCount: 0,
  ...overrides,
});

describe("evaluatePromo", () => {
  it("accepts an active promo with no restrictions", () => {
    expect(evaluatePromo(promo(), 1000, NOW)).toEqual({ applicable: true });
  });

  it.each([
    [promo({ isActive: false }), "inactive"],
    [promo({ startsAt: new Date("2026-11-01T00:00:00Z") }), "not_started"],
    [promo({ endsAt: new Date("2026-10-01T00:00:00Z") }), "expired"],
    [promo({ usageLimit: 5, usedCount: 5 }), "exhausted"],
    [promo({ minSubtotalMinor: 50_000 }), "min_subtotal"],
  ] as const)("rejects with reason %s", (state, reason) => {
    expect(evaluatePromo(state, 10_000, NOW)).toEqual({ applicable: false, reason });
  });

  it("treats the subtotal threshold as inclusive", () => {
    expect(evaluatePromo(promo({ minSubtotalMinor: 10_000 }), 10_000, NOW)).toEqual({
      applicable: true,
    });
  });
});

describe("computeDiscount", () => {
  it("applies percentage discounts with floor rounding", () => {
    expect(computeDiscount(promo({ value: 15 }), 1001, 0)).toBe(150);
  });

  it("never discounts more than the subtotal", () => {
    expect(computeDiscount(promo({ kind: "FIXED", value: 99_999 }), 5000, 0)).toBe(5000);
  });

  it("makes shipping free by discounting the full shipping amount", () => {
    expect(computeDiscount(promo({ kind: "SHIPPING", value: 0 }), 20_000, 1800)).toBe(1800);
  });
});

describe("computeTotals", () => {
  it("sums subtotal and shipping when there is no promo", () => {
    expect(
      computeTotals({ subtotalMinor: 42_000, shippingMinor: 1200, promo: null, now: NOW }),
    ).toEqual({
      subtotalMinor: 42_000,
      discountMinor: 0,
      shippingMinor: 1200,
      totalMinor: 43_200,
      promoRejection: null,
    });
  });

  it("applies a valid percentage promo to the subtotal only", () => {
    const totals = computeTotals({
      subtotalMinor: 10_000,
      shippingMinor: 500,
      promo: promo({ value: 10 }),
      now: NOW,
    });
    expect(totals.discountMinor).toBe(1000);
    expect(totals.totalMinor).toBe(9500);
    expect(totals.promoRejection).toBeNull();
  });

  it("reports the rejection and charges full price when the promo does not apply", () => {
    const totals = computeTotals({
      subtotalMinor: 10_000,
      shippingMinor: 500,
      promo: promo({ minSubtotalMinor: 20_000 }),
      now: NOW,
    });
    expect(totals.discountMinor).toBe(0);
    expect(totals.totalMinor).toBe(10_500);
    expect(totals.promoRejection).toBe("min_subtotal");
  });

  it("never produces a negative total", () => {
    const totals = computeTotals({
      subtotalMinor: 0,
      shippingMinor: 0,
      promo: promo({ kind: "FIXED", value: 500 }),
      now: NOW,
    });
    expect(totals.totalMinor).toBe(0);
  });
});

describe("normalisePromoCode", () => {
  it("trims and upper-cases codes", () => {
    expect(normalisePromoCode("  welcome10 ")).toBe("WELCOME10");
  });
});
