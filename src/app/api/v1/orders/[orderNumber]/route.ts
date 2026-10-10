import { getServices } from "@/server/composition";
import { apiRoute, json } from "@/server/http/api";
import { BadRequestError, NotFoundError } from "@/server/http/errors";
import { resolveCartOwner } from "@/server/modules/cart/cart.context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORDER_NUMBER = /^VLM-\d{8}-[A-Z2-9]{6}$/;

export const GET = apiRoute<{ orderNumber: string }>(async (request, { params }) => {
  if (!ORDER_NUMBER.test(params.orderNumber))
    throw new BadRequestError("The order number is not valid.");
  const services = getServices();
  const { owner } = await resolveCartOwner(request, services.auth, { create: false });
  if (!owner) throw new NotFoundError("We could not find that order.");
  return json(await services.orders.getForOwner(owner, params.orderNumber));
});
