import { getServices } from "@/server/composition";
import { apiRoute, json } from "@/server/http/api";
import { readJson } from "@/server/http/request";
import { resolveCartOwner, resolveWriteOwner } from "@/server/modules/cart/cart.context";
import { applyPromoSchema } from "@/server/modules/cart/cart.schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PUT = apiRoute(async (request) => {
  const body = await readJson(request, applyPromoSchema);
  const services = getServices();
  const { owner, setCookies } = await resolveWriteOwner(request, services.auth);
  return json(await services.cart.applyPromo(owner, body.code), { cookies: setCookies });
});

export const DELETE = apiRoute(async (request) => {
  const services = getServices();
  const { owner } = await resolveCartOwner(request, services.auth, { create: false });
  if (!owner) return json(await services.cart.view(null));
  return json(await services.cart.removePromo(owner));
});
