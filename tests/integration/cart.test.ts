import { describe, expect, it } from "vitest";
import * as csrfRoute from "@/app/api/v1/security/csrf/route";
import * as cartRoute from "@/app/api/v1/cart/route";
import * as itemsRoute from "@/app/api/v1/cart/items/route";
import * as itemRoute from "@/app/api/v1/cart/items/[id]/route";
import * as promoRoute from "@/app/api/v1/cart/promo/route";
import * as shippingRoute from "@/app/api/v1/cart/shipping/route";
import * as registerRoute from "@/app/api/v1/auth/register/route";
import * as loginRoute from "@/app/api/v1/auth/login/route";
import { ApiClient, db, json, type RouteFn } from "./helpers";

type CartBody = {
  itemCount: number;
  items: {
    id: string;
    variantId: string;
    quantity: number;
    size: string;
    lineTotal: { amountMinor: number };
  }[];
  totals: {
    subtotal: { amountMinor: number };
    discount: { amountMinor: number };
    shipping: { amountMinor: number };
    total: { amountMinor: number };
  };
  promo: { code: string; applied: boolean; rejectionReason: string | null } | null;
  checkoutReady: boolean;
};

const csrf = csrfRoute.GET as RouteFn;

async function addToBag(client: ApiClient, variantId: string, size: string, quantity = 1) {
  return client.send(itemsRoute.POST, {
    method: "POST",
    path: "/api/v1/cart/items",
    body: { variantId, size, quantity },
  });
}

describe("bag (cart) API", () => {
  it("returns an empty bag for a visitor with no cookie", async () => {
    const client = new ApiClient(csrf);
    const body = await json<CartBody>(await client.send(cartRoute.GET, { path: "/api/v1/cart" }));
    expect(body.itemCount).toBe(0);
    expect(body.totals.total.amountMinor).toBe(0);
    expect(body.checkoutReady).toBe(false);
  });

  it("creates a guest cart cookie on first add and prices lines from the database", async () => {
    const client = new ApiClient(csrf);
    const response = await addToBag(client, "meridian-coat-camel", "M", 2);
    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie().some((c) => c.startsWith("vellum_guest="))).toBe(true);

    const body = await json<CartBody>(response);
    expect(body.itemCount).toBe(2);
    const line = body.items[0];
    expect(line?.variantId).toBe("meridian-coat-camel");
    expect(line?.lineTotal.amountMinor).toBe(42_000 * 2);
    expect(body.totals.subtotal.amountMinor).toBe(84_000);
  });

  it("refuses quantities above available stock with 409", async () => {
    const client = new ApiClient(csrf);
    const variant = await db().productVariant.findUniqueOrThrow({
      where: { sku: "meridian-coat-camel" },
      include: { sizes: true },
    });
    const stock = variant.sizes.find((row) => row.size === "XL")?.stock ?? 0;
    const response = await addToBag(client, "meridian-coat-camel", "XL", stock + 1);
    expect(response.status).toBe(409);
    expect(await json(response)).toMatchObject({ status: 409, title: "Conflict" });
  });

  it("rejects sizes that the piece does not offer", async () => {
    const client = new ApiClient(csrf);
    const response = await addToBag(client, "meridian-coat-camel", "XXXL");
    expect(response.status).toBe(422);
  });

  it("returns 404 for an unknown variant", async () => {
    const client = new ApiClient(csrf);
    expect((await addToBag(client, "no-such-variant", "M")).status).toBe(404);
  });

  it("updates quantity and removes lines by id", async () => {
    const client = new ApiClient(csrf);
    const added = await json<CartBody>(await addToBag(client, "meridian-coat-camel", "S", 1));
    const lineId = added.items[0]?.id ?? "";

    const updated = await client.send(itemRoute.PATCH, {
      method: "PATCH",
      path: `/api/v1/cart/items/${lineId}`,
      params: { id: lineId },
      body: { quantity: 3 },
    });
    expect((await json<CartBody>(updated)).itemCount).toBe(3);

    const removed = await client.send(itemRoute.DELETE, {
      method: "DELETE",
      path: `/api/v1/cart/items/${lineId}`,
      params: { id: lineId },
    });
    expect((await json<CartBody>(removed)).itemCount).toBe(0);
  });

  it("rejects malformed bag item ids", async () => {
    const client = new ApiClient(csrf);
    const response = await client.send(itemRoute.DELETE, {
      method: "DELETE",
      path: "/api/v1/cart/items/not-a-uuid",
      params: { id: "not-a-uuid" },
    });
    expect(response.status).toBe(400);
  });

  it("applies a valid promo code and recalculates totals server-side", async () => {
    const client = new ApiClient(csrf);
    await addToBag(client, "meridian-coat-camel", "M", 1);
    const response = await client.send(promoRoute.PUT, {
      method: "PUT",
      path: "/api/v1/cart/promo",
      body: { code: " welcome10 " },
    });
    const body = await json<CartBody>(response);
    expect(body.promo).toMatchObject({ code: "WELCOME10", applied: true });
    expect(body.totals.discount.amountMinor).toBe(4200);
    expect(body.totals.total.amountMinor).toBe(42_000 - 4200);
  });

  it("rejects unknown codes, unmet minimums and codes not yet offered", async () => {
    const client = new ApiClient(csrf);
    // FREESHIP needs $150 of goods, so the bag must hold a piece priced below that.
    const cheap = await db().productVariant.findFirstOrThrow({
      where: { isActive: true, product: { priceMinor: { lt: 15_000 } } },
      include: { product: true, sizes: true },
    });
    const size = cheap.sizes.find((row) => row.stock > 0)?.size ?? "";
    await addToBag(client, cheap.sku, size, 1);

    const unknown = await client.send(promoRoute.PUT, {
      method: "PUT",
      path: "/api/v1/cart/promo",
      body: { code: "NOPE" },
    });
    expect(unknown.status).toBe(422);

    const threshold = await client.send(promoRoute.PUT, {
      method: "PUT",
      path: "/api/v1/cart/promo",
      body: { code: "FREESHIP" },
    });
    expect(threshold.status).toBe(422);
    expect(await json(threshold)).toMatchObject({
      detail: "Add more to your bag to use this code.",
    });

    // CIRCLE15 is not seeded until a membership model exists, so the storefront does not recognise it.
    const deferred = await client.send(promoRoute.PUT, {
      method: "PUT",
      path: "/api/v1/cart/promo",
      body: { code: "CIRCLE15" },
    });
    expect(deferred.status).toBe(422);
    expect(await json(deferred)).toMatchObject({ detail: "That code is not recognised." });
  });

  it("adds shipping to the total once a method is chosen", async () => {
    const client = new ApiClient(csrf);
    await addToBag(client, "meridian-coat-camel", "M", 1);
    const response = await client.send(shippingRoute.PUT, {
      method: "PUT",
      path: "/api/v1/cart/shipping",
      body: { shippingMethodId: "us-express" },
    });
    const body = await json<CartBody>(response);
    expect(body.totals.shipping.amountMinor).toBe(1800);
    expect(body.totals.total.amountMinor).toBe(42_000 + 1800);
    expect(body.checkoutReady).toBe(true);
  });

  it("rejects unknown shipping methods", async () => {
    const client = new ApiClient(csrf);
    await addToBag(client, "meridian-coat-camel", "M", 1);
    const response = await client.send(shippingRoute.PUT, {
      method: "PUT",
      path: "/api/v1/cart/shipping",
      body: { shippingMethodId: "moon-rocket" },
    });
    expect(response.status).toBe(422);
  });

  it("merges a guest bag into the customer's cart on sign-in", async () => {
    const guest = new ApiClient(csrf);
    await addToBag(guest, "the-line-pant-ink", "M", 1);

    const email = "merge.shopper@example.com";
    const password = "merge-test-passphrase";
    await guest.send(registerRoute.POST, {
      method: "POST",
      path: "/api/v1/auth/register",
      body: { email, password },
    });
    await guest.send(loginRoute.POST, {
      method: "POST",
      path: "/api/v1/auth/login",
      body: { email, password },
    });

    const bag = await json<CartBody>(await guest.send(cartRoute.GET, { path: "/api/v1/cart" }));
    expect(bag.items.map((line) => line.variantId)).toContain("the-line-pant-ink");
  });
});
