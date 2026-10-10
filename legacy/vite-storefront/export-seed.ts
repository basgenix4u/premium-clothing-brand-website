/**
 * One-off export: converts the prototype's in-code catalogue into the JSON seed
 * snapshot used by `prisma db seed`. Re-run only if the prototype data changes.
 *
 * Usage (from repo root): npx tsx legacy/vite-storefront/export-seed.ts
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import {
  ARTICLES,
  CATEGORIES,
  COLOURS,
  LOOKS,
  PRODUCTS,
  PROMO_RULES,
  REGIONS,
  SIZE_GUIDE,
  STYLES,
} from "./src/data/catalog";

const outFile = path.resolve("../../src/server/db/seed/catalog.seed.json");

const snapshot = {
  generatedFrom: "legacy/vite-storefront/src/data/catalog.ts",
  categories: CATEGORIES,
  colours: Object.values(COLOURS),
  styles: STYLES,
  sizeGuide: SIZE_GUIDE,
  products: PRODUCTS,
  looks: LOOKS,
  articles: ARTICLES,
  regions: REGIONS,
  promoRules: PROMO_RULES,
};

writeFileSync(outFile, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(
  `wrote ${outFile}: ${PRODUCTS.length} products, ${LOOKS.length} looks, ${ARTICLES.length} articles, ${PROMO_RULES.length} promos, ${REGIONS.length} regions`,
);
