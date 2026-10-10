import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/server/db/generated/prisma/client";
import { seedCatalog } from "../src/server/db/seed/seed-catalog";

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required to seed the database");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const summary = await seedCatalog(db);
    console.log(
      `Seeded catalogue: ${summary.categories} categories, ${summary.products} products, ${summary.variants} variants, ${summary.looks} looks, ${summary.articles} articles, ${summary.regions} regions, ${summary.promoCodes} promo codes.`,
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
