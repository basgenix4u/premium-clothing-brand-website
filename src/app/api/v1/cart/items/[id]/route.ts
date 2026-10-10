import { getServices } from "@/server/composition";
import { apiRoute, json } from "@/server/http/api";
import { BadRequestError, NotFoundError } from "@/server/http/errors";
import { readJson } from "@/server/http/request";
import { resolveCartOwner } from "@/server/modules/cart/cart.context";
import { updateItemSchema, uuidSchema } from "@/server/modules/cart/cart.schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parseId = (raw: string): string => {
  const parsed = uuidSchema.safeParse(raw);
  if (!parsed.success) throw new BadRequestError("The bag item id is not valid.");
  return parsed.data;
};

export const PATCH = apiRoute<{ id: string }>(async (request, { params }) => {
  const id = parseId(params.id);
  const body = await readJson(request, updateItemSchema);
  const services = getServices();
  const { owner } = await resolveCartOwner(request, services.auth, { create: false });
  if (!owner) throw new NotFoundError("That bag item could not be found.");
  return json(await services.cart.updateItem(owner, id, body.quantity));
});

export const DELETE = apiRoute<{ id: string }>(async (request, { params }) => {
  const id = parseId(params.id);
  const services = getServices();
  const { owner } = await resolveCartOwner(request, services.auth, { create: false });
  if (!owner) throw new NotFoundError("That bag item could not be found.");
  return json(await services.cart.removeItem(owner, id));
});
