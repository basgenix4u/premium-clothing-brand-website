import { getServices } from "@/server/composition";
import { apiRoute, json } from "@/server/http/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute(async () => {
  const items = await getServices().catalog.listRegions();
  return json({ items });
});
