import { getServices } from "@/server/composition";
import { apiRoute, json } from "@/server/http/api";
import { getLogger } from "@/server/logging/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Readiness: the process can serve traffic only if the database answers. */
export const GET = apiRoute(async () => {
  try {
    await getServices().db.$queryRaw`SELECT 1`;
    return json({ status: "ready", checks: { database: "ok" } });
  } catch (error: unknown) {
    getLogger().error({ err: error }, "readiness check failed: database");
    return json({ status: "unavailable", checks: { database: "down" } }, { status: 503 });
  }
});
