import path from "node:path";
import { defineConfig } from "vitest/config";

/** Unit tests: pure logic and HTTP helpers. No database or network. */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    env: { NODE_ENV: "test", LOG_LEVEL: "silent" },
    coverage: {
      provider: "v8",
      include: [
        "src/server/modules/cart/pricing.ts",
        "src/server/modules/cart/policy.ts",
        "src/server/modules/auth/password.ts",
        "src/server/modules/auth/schemas.ts",
        "src/server/modules/checkout/checkout.schemas.ts",
        "src/server/modules/cart/cart.schemas.ts",
        "src/server/modules/catalog/catalog.schemas.ts",
        "src/server/modules/catalog/catalog.service.ts",
        "src/server/http/*.ts",
        "src/server/security/*.ts",
        "src/server/config/env.ts",
        "src/server/logging/logger.ts",
        "src/shared/*.ts",
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
    },
  },
});
