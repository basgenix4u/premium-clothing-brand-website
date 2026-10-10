import { z } from "zod";
import type { PrismaClient } from "../generated/prisma/client";
import snapshotJson from "./catalog.seed.json";

/** Shape of the JSON snapshot exported from the prototype. Validated before any write. */
const seedSnapshotSchema = z.object({
  categories: z.array(
    z.object({ id: z.string(), name: z.string(), blurb: z.string(), image: z.string() }),
  ),
  products: z.array(
    z.object({
      id: z.string(),
      slug: z.string(),
      name: z.string(),
      subtitle: z.string(),
      price: z.number().nonnegative(),
      category: z.string(),
      audience: z.array(z.enum(["women", "men", "unisex"])),
      styles: z.array(z.string()),
      badges: z.array(z.enum(["new", "bestseller", "limited"])),
      releasedAt: z.string(),
      popularity: z.number().int(),
      description: z.string(),
      details: z.array(z.string()),
      composition: z.string(),
      care: z.array(z.string()),
      fit: z.object({ note: z.string(), model: z.string(), runs: z.string() }),
      variants: z.array(
        z.object({
          id: z.string(),
          colour: z.string(),
          images: z.array(z.string()),
          sizes: z.array(z.object({ size: z.string(), stock: z.number().int().nonnegative() })),
        }),
      ),
    }),
  ),
  looks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      season: z.string(),
      image: z.string(),
      copy: z.string(),
      styling: z.string(),
      items: z.array(
        z.object({ slug: z.string(), x: z.number(), y: z.number(), label: z.string() }),
      ),
    }),
  ),
  articles: z.array(
    z.object({
      slug: z.string(),
      title: z.string(),
      kicker: z.string(),
      readTime: z.string(),
      image: z.string(),
      excerpt: z.string(),
      body: z.array(z.string()),
      related: z.array(z.string()),
    }),
  ),
  regions: z.array(
    z.object({
      code: z.string(),
      label: z.string(),
      currency: z.string().length(3),
      locale: z.string(),
      rate: z.number().positive(),
      taxNote: z.string(),
      sizeSystem: z.string(),
      shipping: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          eta: z.string(),
          price: z.number().nonnegative(),
          note: z.string().optional(),
        }),
      ),
    }),
  ),
  promoRules: z.array(
    z.object({
      code: z.string(),
      kind: z.enum(["percent", "fixed", "shipping"]),
      value: z.number().nonnegative(),
      minSubtotal: z.number().nonnegative(),
      description: z.string(),
    }),
  ),
});

export type SeedSnapshot = z.infer<typeof seedSnapshotSchema>;

export type SeedSummary = {
  categories: number;
  products: number;
  variants: number;
  looks: number;
  articles: number;
  regions: number;
  promoCodes: number;
};

/**
 * Offers present in the prototype whose rules are not built yet. CIRCLE15 is for Circle
 * members, but there is no membership model, so it stays inactive until one exists.
 */
export const DEFERRED_PROMO_CODES: readonly string[] = ["CIRCLE15"];

const toMinor = (amount: number): number => Math.round(amount * 100);
const FIXED_PUBLISH_DATE = new Date("2026-01-15T00:00:00.000Z");

export function loadSnapshot(): SeedSnapshot {
  return seedSnapshotSchema.parse(snapshotJson);
}

/**
 * Idempotent: safe to run on every deploy. Catalogue content is refreshed from the snapshot,
 * but inventory rows are created only when missing, so live stock is never overwritten.
 */
export async function seedCatalog(
  db: PrismaClient,
  snapshot: SeedSnapshot = loadSnapshot(),
): Promise<SeedSummary> {
  const categoryIds = new Map<string, string>();
  for (const [index, category] of snapshot.categories.entries()) {
    const row = await db.category.upsert({
      where: { slug: category.id },
      create: {
        slug: category.id,
        name: category.name,
        blurb: category.blurb,
        imageUrl: category.image,
        sortOrder: index,
      },
      update: {
        name: category.name,
        blurb: category.blurb,
        imageUrl: category.image,
        sortOrder: index,
      },
    });
    categoryIds.set(category.id, row.id);
  }

  for (const region of snapshot.regions) {
    await db.region.upsert({
      where: { code: region.code },
      create: {
        code: region.code,
        label: region.label,
        currency: region.currency,
        locale: region.locale,
        fxRate: region.rate,
        taxNote: region.taxNote,
        sizeSystem: region.sizeSystem,
      },
      update: {
        label: region.label,
        currency: region.currency,
        locale: region.locale,
        fxRate: region.rate,
        taxNote: region.taxNote,
      },
    });
    for (const method of region.shipping) {
      const data = {
        regionCode: region.code,
        label: method.label,
        eta: method.eta,
        priceMinor: toMinor(method.price),
        note: method.note ?? null,
      };
      await db.shippingMethod.upsert({
        where: { id: method.id },
        create: { id: method.id, ...data },
        update: data,
      });
    }
  }

  const activePromos = snapshot.promoRules.filter(
    (promo) => !DEFERRED_PROMO_CODES.includes(promo.code),
  );
  for (const promo of activePromos) {
    const kind = promo.kind.toUpperCase() as "PERCENT" | "FIXED" | "SHIPPING";
    const value = kind === "FIXED" ? toMinor(promo.value) : Math.round(promo.value);
    const data = {
      kind,
      value,
      minSubtotalMinor: toMinor(promo.minSubtotal),
      description: promo.description,
    };
    await db.promoCode.upsert({
      where: { code: promo.code },
      create: { code: promo.code, ...data },
      update: data,
    });
  }

  // Databases seeded before an offer was deferred keep its row, so deactivate it rather than delete it.
  await db.promoCode.updateMany({
    where: { code: { in: [...DEFERRED_PROMO_CODES] } },
    data: { isActive: false },
  });

  let variantCount = 0;
  for (const product of snapshot.products) {
    const categoryId = categoryIds.get(product.category);
    if (!categoryId)
      throw new Error(
        `Seed product ${product.slug} references unknown category ${product.category}`,
      );
    const productData = {
      name: product.name,
      subtitle: product.subtitle,
      description: product.description,
      composition: product.composition,
      details: product.details,
      care: product.care,
      fitNote: product.fit.note,
      fitModel: product.fit.model,
      fitRuns: product.fit.runs,
      priceMinor: toMinor(product.price),
      audiences: product.audience.map(
        (audience) => audience.toUpperCase() as "WOMEN" | "MEN" | "UNISEX",
      ),
      styles: product.styles,
      badges: product.badges.map(
        (badge) => badge.toUpperCase() as "NEW" | "BESTSELLER" | "LIMITED",
      ),
      popularity: product.popularity,
      releasedAt: new Date(product.releasedAt),
      categoryId,
    };
    const row = await db.product.upsert({
      where: { slug: product.slug },
      create: { slug: product.slug, ...productData },
      update: productData,
    });

    for (const [index, variant] of product.variants.entries()) {
      const variantRow = await db.productVariant.upsert({
        where: { sku: variant.id },
        create: {
          productId: row.id,
          sku: variant.id,
          colour: variant.colour,
          imageUrls: variant.images,
          sortOrder: index,
        },
        update: { colour: variant.colour, imageUrls: variant.images, sortOrder: index },
      });
      variantCount += 1;
      for (const size of variant.sizes) {
        // Inventory is seeded once. Later changes come from the admin API, never from the seed.
        await db.variantSize.upsert({
          where: { variantId_size: { variantId: variantRow.id, size: size.size } },
          create: { variantId: variantRow.id, size: size.size, stock: size.stock },
          update: {},
        });
      }
    }
  }

  for (const [sortOrder, look] of snapshot.looks.entries()) {
    const data = {
      title: look.title,
      season: look.season,
      imageUrl: look.image,
      copy: look.copy,
      styling: look.styling,
      items: look.items,
      sortOrder,
    };
    await db.look.upsert({
      where: { slug: look.id },
      create: { slug: look.id, publishedAt: FIXED_PUBLISH_DATE, ...data },
      update: data,
    });
  }

  for (const [sortOrder, article] of snapshot.articles.entries()) {
    const data = {
      title: article.title,
      kicker: article.kicker,
      readTime: article.readTime,
      imageUrl: article.image,
      excerpt: article.excerpt,
      body: article.body,
      related: article.related,
      sortOrder,
    };
    await db.article.upsert({
      where: { slug: article.slug },
      create: { slug: article.slug, publishedAt: FIXED_PUBLISH_DATE, ...data },
      update: data,
    });
  }

  return {
    categories: snapshot.categories.length,
    products: snapshot.products.length,
    variants: variantCount,
    looks: snapshot.looks.length,
    articles: snapshot.articles.length,
    regions: snapshot.regions.length,
    promoCodes: activePromos.length,
  };
}
