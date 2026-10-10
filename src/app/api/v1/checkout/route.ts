import { getServices } from "@/server/composition";
import { apiRoute, json } from "@/server/http/api";
import { BadRequestError, UnprocessableError } from "@/server/http/errors";
import { readJson } from "@/server/http/request";
import { resolveCartOwner } from "@/server/modules/cart/cart.context";
import {
  checkoutSchema,
  IDEMPOTENCY_KEY_PATTERN,
} from "@/server/modules/checkout/checkout.schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = apiRoute(async (request) => {
  const key = request.headers.get("idempotency-key");
  if (!key || !IDEMPOTENCY_KEY_PATTERN.test(key)) {
    throw new BadRequestError(
      "An Idempotency-Key header (8–80 letters, digits, - or _) is required.",
    );
  }
  const body = await readJson(request, checkoutSchema);
  const services = getServices();
  const { owner } = await resolveCartOwner(request, services.auth, { create: false });
  if (!owner) throw new UnprocessableError("Your bag is empty.");
  const result = await services.checkout.placeOrder(owner, key, body);
  return json(
    { order: result.order, replayed: result.replayed },
    { status: result.replayed ? 200 : 201 },
  );
});
