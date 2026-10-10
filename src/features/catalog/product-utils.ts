import type { ProductSummaryDto, VariantDto } from "@/shared/catalog-dto";

export const BADGE_LABELS: Record<string, string> = {
  new: "New",
  bestseller: "Most reached for",
  limited: "Limited run",
};

export const variantStock = (variant: VariantDto): number =>
  variant.sizes.reduce((total, size) => total + size.stock, 0);

export const isVariantSoldOut = (variant: VariantDto): boolean => variantStock(variant) <= 0;

export const availableSizes = (variant: VariantDto) =>
  variant.sizes.filter((size) => size.stock > 0);

export const isProductAvailable = (product: ProductSummaryDto): boolean =>
  product.variants.some((variant) => !isVariantSoldOut(variant));

export const newestFirst = (products: ProductSummaryDto[]): ProductSummaryDto[] =>
  [...products].sort((a, b) => Date.parse(b.releasedAt) - Date.parse(a.releasedAt));

export const byPopularity = (products: ProductSummaryDto[]): ProductSummaryDto[] =>
  [...products].sort((a, b) => b.popularity - a.popularity);

export const countWithStyle = (products: ProductSummaryDto[], style: string): number =>
  products.filter((product) => product.styles.includes(style)).length;

export const countInCategory = (products: ProductSummaryDto[], categorySlug: string): number =>
  products.filter((product) => product.category.slug === categorySlug).length;
