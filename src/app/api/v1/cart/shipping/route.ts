import { getServices } from "@/server/composition";
import { apiRoute, json } from "@/server/http/api";
import { NotFoundError } from "@/server/http/errors";
import { readJson } from "@/server/http/request";
import { resolveCartOwner } from "@/server/modules/cart/cart.context";
import { shippingSchema } from "@/server/modules/cart/cart.schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PUT = apiRoute(async (request) => {
  const body = await readJson(request, shippingSchema);
  const services = getServices();
  const { owner } = await resolveCartOwner(request, services.auth, { create: false });
  if (!owner) throw new NotFoundError("Your bag is empty.");
  return json(await services.cart.selectShipping(owner, body.shippingMethodId));
});
