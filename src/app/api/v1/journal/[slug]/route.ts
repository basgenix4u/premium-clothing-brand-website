import { getServices } from "@/server/composition";
import { apiRoute, json } from "@/server/http/api";
import { BadRequestError } from "@/server/http/errors";
import { articleSlugSchema } from "@/server/modules/content/content.schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute<{ slug: string }>(async (_request, { params }) => {
  const parsed = articleSlugSchema.safeParse(params.slug);
  if (!parsed.success) throw new BadRequestError("The story link is not valid.");
  const article = await getServices().content.getArticle(parsed.data);
  return json(article);
});
