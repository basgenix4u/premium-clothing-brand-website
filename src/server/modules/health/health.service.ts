import type { AppEnv } from "@/server/config/env";

export type SmokeReport = {
  status: "ok";
  service: "vellum-storefront";
  version: string;
  environment: AppEnv["NODE_ENV"];
  timestamp: string;
  checks: {
    configuration: "ok";
  };
};

/** Pure function: builds the smoke report from validated configuration. */
export function buildSmokeReport(env: AppEnv, now: Date = new Date()): SmokeReport {
  return {
    status: "ok",
    service: "vellum-storefront",
    version: env.APP_VERSION,
    environment: env.NODE_ENV,
    timestamp: now.toISOString(),
    checks: { configuration: "ok" },
  };
}
