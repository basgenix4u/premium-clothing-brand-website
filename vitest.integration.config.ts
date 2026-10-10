import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Integration tests: exercise route handlers against a real PostgreSQL database.
 * Requires DATABASE_URL in .env.test.local (database name must contain "test").
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    globalSetup: ["tests/integration/global-setup.ts"],
    // Tests share one database. Run files sequentially to keep fixtures isolated.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
    env: {
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
      TRUST_PROXY: "true",
      APP_URL: "http://localhost:3000",
    },
  },
});
