import { getServices } from "@/server/composition";
import { apiRoute, json } from "@/server/http/api";
import { readJson } from "@/server/http/request";
import { resolveWriteOwner } from "@/server/modules/cart/cart.context";
import { addItemSchema } from "@/server/modules/cart/cart.schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = apiRoute(async (request) => {
  const body = await readJson(request, addItemSchema);
  const services = getServices();
  const { owner, setCookies } = await resolveWriteOwner(request, services.auth);
  const view = await services.cart.addItem(owner, body);
  return json(view, { cookies: setCookies });
});
