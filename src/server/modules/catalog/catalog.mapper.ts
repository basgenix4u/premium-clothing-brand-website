import type { Prisma } from "@/server/db/generated/prisma/client";
import { COLOUR_PALETTE } from "@/shared/palette";
import { usd, type Money } from "@/shared/money";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "One size"];

export type ProductRecord = Prisma.ProductGetPayload<{
  include: { category: true; variants: { include: { sizes: true } } };
}>;

export type ProductSummaryDto = {
  slug: string;
  name: string;
  subtitle: string;
  price: Money;
  category: { slug: string; name: string };
  audiences: string[];
  styles: string[];
  badges: string[];
  releasedAt: string;
  inStock: boolean;
  primaryImage: string | null;
};

export type ProductDetailDto = ProductSummaryDto & {
  description: string;
  composition: string;
  details: string[];
  care: string[];
  fit: { note: string; model: string; runs: string };
  popularity: number;
  variants: {
    id: string;
    colour: { id: string; name: string; hex: string };
    images: string[];
    sizes: { size: string; stock: number; available: boolean }[];
  }[];
};

const sizeRank = (size: string): number => {
  const index = SIZE_ORDER.indexOf(size);
  return index === -1 ? SIZE_ORDER.length : index;
};

const colourOf = (id: string) => COLOUR_PALETTE[id] ?? { id, name: id, hex: "#999999" };

export function toProductSummary(product: ProductRecord): ProductSummaryDto {
  const variants = product.variants.filter((variant) => variant.isActive);
  const inStock = variants.some((variant) => variant.sizes.some((size) => size.stock > 0));
  return {
    slug: product.slug,
    name: product.name,
    subtitle: product.subtitle,
    price: usd(product.priceMinor),
    category: { slug: product.category.slug, name: product.category.name },
    audiences: product.audiences.map((audience) => audience.toLowerCase()),
    styles: product.styles,
    badges: product.badges.map((badge) => badge.toLowerCase()),
    releasedAt: product.releasedAt.toISOString(),
    inStock,
    primaryImage: variants[0]?.imageUrls[0] ?? null,
  };
}

export function toProductDetail(product: ProductRecord): ProductDetailDto {
  return {
    ...toProductSummary(product),
    description: product.description,
    composition: product.composition,
    details: product.details,
    care: product.care,
    fit: { note: product.fitNote, model: product.fitModel, runs: product.fitRuns },
    popularity: product.popularity,
    variants: product.variants
      .filter((variant) => variant.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((variant) => ({
        id: variant.sku,
        colour: colourOf(variant.colour),
        images: variant.imageUrls,
        sizes: [...variant.sizes]
          .sort((a, b) => sizeRank(a.size) - sizeRank(b.size))
          .map((size) => ({ size: size.size, stock: size.stock, available: size.stock > 0 })),
      })),
  };
}
