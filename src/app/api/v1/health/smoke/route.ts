import { NextResponse } from "next/server";
import { getEnv } from "@/server/config/env";
import { getLogger } from "@/server/logging/logger";
import { buildSmokeReport } from "@/server/modules/health/health.service";
import { problem } from "@/shared/problem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export function GET(): NextResponse {
  try {
    const report = buildSmokeReport(getEnv());
    return NextResponse.json(report, { status: 200, headers: NO_STORE });
  } catch (error: unknown) {
    getLogger().error({ err: error }, "smoke check failed");
    return NextResponse.json(problem(503, "Service unavailable"), {
      status: 503,
      headers: { ...NO_STORE, "Content-Type": "application/problem+json" },
    });
  }
}
