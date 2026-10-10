import type { Prisma } from "@/server/db/generated/prisma/client";
import type { Db } from "@/server/db/client";
import type { ProductQuery } from "@/server/modules/catalog/catalog.schemas";
import type { ProductRecord } from "@/server/modules/catalog/catalog.mapper";

const productInclude = {
  category: true,
  variants: { include: { sizes: true }, orderBy: { sortOrder: "asc" } },
} satisfies Prisma.ProductInclude;

export function buildProductWhere(query: ProductQuery): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isPublished: true };
  if (query.category) where.category = { slug: query.category };
  if (query.audience)
    where.audiences = { has: query.audience.toUpperCase() as "WOMEN" | "MEN" | "UNISEX" };
  if (query.style) where.styles = { has: query.style };
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { subtitle: { contains: query.q, mode: "insensitive" } },
    ];
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.priceMinor = {
      ...(query.minPrice !== undefined ? { gte: Math.round(query.minPrice * 100) } : {}),
      ...(query.maxPrice !== undefined ? { lte: Math.round(query.maxPrice * 100) } : {}),
    };
  }
  const variantFilter: Prisma.ProductVariantWhereInput = { isActive: true };
  if (query.colour) variantFilter.colour = query.colour;
  if (query.size) variantFilter.sizes = { some: { size: query.size, stock: { gt: 0 } } };
  if (query.colour || query.size) where.variants = { some: variantFilter };
  return where;
}

export function buildProductOrder(
  sort: ProductQuery["sort"],
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ releasedAt: "desc" }, { id: "asc" }];
    case "price-asc":
      return [{ priceMinor: "asc" }, { id: "asc" }];
    case "price-desc":
      return [{ priceMinor: "desc" }, { id: "asc" }];
    case "popularity":
      return [{ popularity: "desc" }, { id: "asc" }];
    case "featured":
      return [{ popularity: "desc" }, { releasedAt: "desc" }, { id: "asc" }];
  }
}

export class CatalogRepository {
  constructor(private readonly db: Db) {}

  listCategories() {
    return this.db.category.findMany({ orderBy: { sortOrder: "asc" } });
  }

  async listProducts(query: ProductQuery, offset: number): Promise<ProductRecord[]> {
    return this.db.product.findMany({
      where: buildProductWhere(query),
      orderBy: buildProductOrder(query.sort),
      skip: offset,
      take: query.limit + 1,
      include: productInclude,
    });
  }

  findPublishedBySlug(slug: string): Promise<ProductRecord | null> {
    return this.db.product.findFirst({
      where: { slug, isPublished: true },
      include: productInclude,
    });
  }

  async listRelated(slug: string, categorySlug: string, limit: number): Promise<ProductRecord[]> {
    return this.db.product.findMany({
      where: { isPublished: true, slug: { not: slug }, category: { slug: categorySlug } },
      orderBy: [{ popularity: "desc" }, { id: "asc" }],
      take: limit,
      include: productInclude,
    });
  }
}
