import { execFileSync } from "node:child_process";
import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/server/db/generated/prisma/client";
import { seedCatalog } from "../../src/server/db/seed/seed-catalog";

/**
 * Resets the test database before the integration suite: applies migrations,
 * truncates every table, then seeds the catalogue. Refuses to touch non-test databases.
 */
export default async function setup(): Promise<void> {
  loadEnv({ path: ".env.test.local" });
  const url = process.env.DATABASE_URL;
  if (!url)
    throw new Error("DATABASE_URL is not set. Create .env.test.local for integration tests.");
  const databaseName = new URL(url).pathname.replace("/", "");
  if (!databaseName.includes("test")) {
    throw new Error(`Refusing to run integration tests against database "${databaseName}".`);
  }

  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    const tables = await db.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
    if (tables.length > 0) {
      const list = tables.map((table) => `"public"."${table.tablename}"`).join(", ");
      await db.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
    }
    await seedCatalog(db);
  } finally {
    await db.$disconnect();
  }
}
