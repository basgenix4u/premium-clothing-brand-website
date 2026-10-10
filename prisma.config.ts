import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma CLI does not read .env.local automatically; load it here for local work.
loadEnv({ path: ".env.local" });
loadEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Placeholder keeps `prisma generate` working in CI without a database.
    url: process.env.DATABASE_URL ?? "postgresql://user:pass@localhost:5432/vellum",
  },
});
