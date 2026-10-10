/** Frontend-facing catalogue shapes. Shared by the API mappers and the browser code. */
import type { Money } from "@/shared/money";

export type ColourDto = { id: string; name: string; hex: string };

export type SizeDto = { size: string; stock: number; available: boolean };

export type VariantDto = {
  id: string;
  colour: ColourDto;
  images: string[];
  sizes: SizeDto[];
};

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
  popularity: number;
  variants: VariantDto[];
};

export type ProductDetailDto = ProductSummaryDto & {
  description: string;
  composition: string;
  details: string[];
  care: string[];
  fit: { note: string; model: string; runs: string };
};

export type CategoryDto = { slug: string; name: string; blurb: string; imageUrl: string };

export type RegionDto = {
  code: string;
  label: string;
  currency: string;
  locale: string;
  sizeSystem: string;
  taxNote: string;
  fxRate: number;
};
