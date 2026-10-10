import { BadRequestError, NotFoundError } from "@/server/http/errors";
import type { CatalogRepository } from "@/server/modules/catalog/catalog.repository";
import type { ProductQuery } from "@/server/modules/catalog/catalog.schemas";
import {
  toProductDetail,
  toProductSummary,
  type ProductDetailDto,
  type ProductSummaryDto,
} from "@/server/modules/catalog/catalog.mapper";

export type ProductPage = { items: ProductSummaryDto[]; nextCursor: string | null };

/** Opaque cursor. Offset-based in v1; keyset pagination is a planned optimisation. */
export const encodeCursor = (offset: number): string =>
  Buffer.from(String(offset), "utf8").toString("base64url");

export function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  const decoded = Buffer.from(cursor, "base64url").toString("utf8");
  if (!/^\d{1,7}$/.test(decoded)) throw new BadRequestError("The cursor is not valid.");
  return Number(decoded);
}

export class CatalogService {
  constructor(private readonly repository: CatalogRepository) {}

  async listCategories() {
    const categories = await this.repository.listCategories();
    return categories.map((category) => ({
      slug: category.slug,
      name: category.name,
      blurb: category.blurb,
      imageUrl: category.imageUrl,
    }));
  }

  /** Regions for the storefront picker. Prices stay in USD; `fxRate` is applied for display only. */
  async listRegions() {
    const regions = await this.repository.listRegions();
    return regions.map((region) => ({
      code: region.code,
      label: region.label,
      currency: region.currency,
      locale: region.locale,
      sizeSystem: region.sizeSystem,
      taxNote: region.taxNote,
      fxRate: region.fxRate.toNumber(),
    }));
  }

  async listProducts(query: ProductQuery): Promise<ProductPage> {
    const offset = decodeCursor(query.cursor);
    const rows = await this.repository.listProducts(query, offset);
    const hasMore = rows.length > query.limit;
    const pageRows = rows.slice(0, query.limit);
    return {
      items: pageRows.map(toProductSummary),
      nextCursor: hasMore ? encodeCursor(offset + query.limit) : null,
    };
  }

  async getProduct(
    slug: string,
  ): Promise<{ product: ProductDetailDto; related: ProductSummaryDto[] }> {
    const record = await this.repository.findPublishedBySlug(slug);
    if (!record) throw new NotFoundError("We could not find that piece.");
    const related = await this.repository.listRelated(slug, record.category.slug, 4);
    return { product: toProductDetail(record), related: related.map(toProductSummary) };
  }
}
