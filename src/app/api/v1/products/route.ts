import { getServices } from "@/server/composition";
import { apiRoute, json } from "@/server/http/api";
import { parseQuery } from "@/server/http/request";
import { productQuerySchema } from "@/server/modules/catalog/catalog.schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute(async (request) => {
  const query = parseQuery(new URL(request.url), productQuerySchema);
  const page = await getServices().catalog.listProducts(query);
  return json(page);
});
