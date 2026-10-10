import type { RegionDto } from "@/shared/catalog-dto";
import type { Money } from "@/shared/money";

/**
 * Display-only conversion of the USD base price into the shopper's region, using the
 * server's FX rate. Checkout always charges in the base currency, so this is guidance.
 */
export function formatRegionMoney(money: Money, region: RegionDto | null): string {
  const rate = region?.fxRate ?? 1;
  const currency = region?.currency ?? money.currency;
  const locale = region?.locale ?? "en-US";
  const value = (money.amountMinor / 100) * rate;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" || value % 1 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(value);
}
