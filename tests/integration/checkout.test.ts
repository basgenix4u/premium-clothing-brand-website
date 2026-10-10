import { describe, expect, it } from "vitest";
import * as csrfRoute from "@/app/api/v1/security/csrf/route";
import * as cartRoute from "@/app/api/v1/cart/route";
import * as itemsRoute from "@/app/api/v1/cart/items/route";
import * as shippingRoute from "@/app/api/v1/cart/shipping/route";
import * as checkoutRoute from "@/app/api/v1/checkout/route";
import { ApiClient, db, json, type RouteFn } from "./helpers";

const csrf = csrfRoute.GET as RouteFn;
const ORDER_NUMBER = /^VLM-\d{8}-[A-Z2-9]{6}$/;

const address = {
  fullName: "Grace Hopper",
  line1: "1 Harbour Way",
  city: "Arlington",
  postalCode: "22201",
  country: "us",
};

type OrderBody = {
  order: {
    orderNumber: string;
    status: string;
    totals: {
      subtotal: { amountMinor: number };
      discount: { amountMinor: number };
      shipping: { amountMinor: number };
      total: { amountMinor: number };
    };
    items: { sku: string; size: string; quantity: number }[];
  };
  replayed: boolean;
};

async function stockOf(sku: string, size: string): Promise<number> {
  const row = await db().variantSize.findFirstOrThrow({
    where: { size, variant: { sku } },
  });
  return row.stock;
}

/** Builds a bag with one piece, a shipping method, and returns the client that owns it. */
async function readyBag(
  sku: string,
  size: string,
  shippingMethodId = "us-express",
): Promise<ApiClient> {
  const client = new ApiClient(csrf);
  await client.send(itemsRoute.POST, {
    method: "POST",
    path: "/api/v1/cart/items",
    body: { variantId: sku, size, quantity: 1 },
  });
  await client.send(shippingRoute.PUT, {
    method: "PUT",
    path: "/api/v1/cart/shipping",
    body: { shippingMethodId },
  });
  return client;
}

const checkout = (client: ApiClient, key: string, email = "grace@example.com") =>
  client.send(checkoutRoute.POST, {
    method: "POST",
    path: "/api/v1/checkout",
    headers: { "idempotency-key": key },
    body: { email, shippingAddress: address },
  });

describe("checkout", () => {
  it("requires an Idempotency-Key header", async () => {
    const client = await readyBag("meridian-coat-camel", "M");
    const response = await client.send(checkoutRoute.POST, {
      method: "POST",
      path: "/api/v1/checkout",
      body: { email: "no-key@example.com", shippingAddress: address },
    });
    expect(response.status).toBe(400);
  });

  it("refuses checkout with an empty bag", async () => {
    const client = new ApiClient(csrf);
    const response = await checkout(client, "empty-bag-key-1");
    expect(response.status).toBe(422);
    expect(await json(response)).toMatchObject({ detail: "Your bag is empty." });
  });

  it("refuses checkout until a shipping method is chosen", async () => {
    const client = new ApiClient(csrf);
    await client.send(itemsRoute.POST, {
      method: "POST",
      path: "/api/v1/cart/items",
      body: { variantId: "meridian-coat-camel", size: "M", quantity: 1 },
    });
    const response = await checkout(client, "no-ship-key-1");
    expect(response.status).toBe(422);
  });

  it("validates the shipping address and rejects unknown fields", async () => {
    const client = await readyBag("meridian-coat-camel", "M");
    const response = await client.send(checkoutRoute.POST, {
      method: "POST",
      path: "/api/v1/checkout",
      headers: { "idempotency-key": "bad-address-key" },
      body: {
        email: "grace@example.com",
        shippingAddress: { ...address, country: "USA", isAdmin: true },
      },
    });
    expect(response.status).toBe(422);
  });

  it("places an order priced from the database, decrements stock and clears the bag", async () => {
    const client = await readyBag("meridian-coat-camel", "M", "us-express");
    const before = await stockOf("meridian-coat-camel", "M");

    const response = await checkout(client, "happy-path-key-1");
    expect(response.status).toBe(201);
    const body = await json<OrderBody>(response);
    expect(body.replayed).toBe(false);
    expect(body.order.orderNumber).toMatch(ORDER_NUMBER);
    expect(body.order.status).toBe("pending_payment");
    expect(body.order.totals.subtotal.amountMinor).toBe(42_000);
    expect(body.order.totals.discount.amountMinor).toBe(0);
    expect(body.order.totals.shipping.amountMinor).toBe(1_800);
    expect(body.order.totals.total.amountMinor).toBe(43_800);
    expect(body.order.items[0]).toMatchObject({
      sku: "meridian-coat-camel",
      size: "M",
      quantity: 1,
    });

    expect(await stockOf("meridian-coat-camel", "M")).toBe(before - 1);

    const bag = await json<{ itemCount: number }>(
      await client.send(cartRoute.GET, { path: "/api/v1/cart" }),
    );
    expect(bag.itemCount).toBe(0);
  });

  it("returns the original order when the same key is replayed, without a second order or stock move", async () => {
    const client = await readyBag("the-line-pant-ink", "S", "us-standard");
    const first = await checkout(client, "replay-key-0001", "replay@example.com");
    expect(first.status).toBe(201);
    const firstBody = await json<OrderBody>(first);
    const stockAfterFirst = await stockOf("the-line-pant-ink", "S");

    const replay = await checkout(client, "replay-key-0001", "replay@example.com");
    expect(replay.status).toBe(200);
    const replayBody = await json<OrderBody>(replay);
    expect(replayBody.replayed).toBe(true);
    expect(replayBody.order.orderNumber).toBe(firstBody.order.orderNumber);

    expect(await db().order.count({ where: { email: "replay@example.com" } })).toBe(1);
    expect(await stockOf("the-line-pant-ink", "S")).toBe(stockAfterFirst);
  });

  it("never lets two concurrent checkouts both take the last piece", async () => {
    // Set up exactly one unit of stock for this size, then have two shoppers hold it in their bags.
    const variant = await db().productVariant.findUniqueOrThrow({
      where: { sku: "meridian-coat-bone" },
    });
    await db().variantSize.updateMany({
      where: { variantId: variant.id, size: "XL" },
      data: { stock: 1 },
    });

    const first = new ApiClient(csrf);
    const second = new ApiClient(csrf);
    for (const shopper of [first, second]) {
      const added = await shopper.send(itemsRoute.POST, {
        method: "POST",
        path: "/api/v1/cart/items",
        body: { variantId: "meridian-coat-bone", size: "XL", quantity: 1 },
      });
      expect(added.status).toBe(200);
      await shopper.send(shippingRoute.PUT, {
        method: "PUT",
        path: "/api/v1/cart/shipping",
        body: { shippingMethodId: "us-standard" },
      });
    }

    const [a, b] = await Promise.all([
      checkout(first, "race-key-aaaaaa1", "race-a@example.com"),
      checkout(second, "race-key-bbbbbb2", "race-b@example.com"),
    ]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    expect(await stockOf("meridian-coat-bone", "XL")).toBe(0);
    expect(
      await db().order.count({ where: { items: { some: { sku: "meridian-coat-bone" } } } }),
    ).toBeGreaterThanOrEqual(1);
  });

  it("rejects a malformed Idempotency-Key", async () => {
    const client = await readyBag("meridian-coat-camel", "M");
    const response = await checkout(client, "short");
    expect(response.status).toBe(400);
  });
});
