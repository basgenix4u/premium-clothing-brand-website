import { getServices } from "@/server/composition";
import { apiRoute, json } from "@/server/http/api";
import { BadRequestError } from "@/server/http/errors";
import { slugSchema } from "@/server/modules/catalog/catalog.schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute<{ slug: string }>(async (_request, { params }) => {
  const parsed = slugSchema.safeParse(params.slug);
  if (!parsed.success) throw new BadRequestError("The product link is not valid.");
  const result = await getServices().catalog.getProduct(parsed.data);
  return json(result);
});
