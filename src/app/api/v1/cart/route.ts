import { getServices } from "@/server/composition";
import { apiRoute, json } from "@/server/http/api";
import { resolveCartOwner } from "@/server/modules/cart/cart.context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute(async (request) => {
  const services = getServices();
  const { owner } = await resolveCartOwner(request, services.auth, { create: false });
  return json(await services.cart.view(owner));
});
