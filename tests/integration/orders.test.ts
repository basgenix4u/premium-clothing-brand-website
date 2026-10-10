import { describe, expect, it } from "vitest";
import * as csrfRoute from "@/app/api/v1/security/csrf/route";
import * as itemsRoute from "@/app/api/v1/cart/items/route";
import * as shippingRoute from "@/app/api/v1/cart/shipping/route";
import * as checkoutRoute from "@/app/api/v1/checkout/route";
import * as registerRoute from "@/app/api/v1/auth/register/route";
import * as loginRoute from "@/app/api/v1/auth/login/route";
import * as ordersRoute from "@/app/api/v1/orders/route";
import * as orderRoute from "@/app/api/v1/orders/[orderNumber]/route";
import { ApiClient, json, type RouteFn } from "./helpers";

const csrf = csrfRoute.GET as RouteFn;
const PASSWORD = "orders-test-passphrase";
const address = { fullName: "Mary Shelley", line1: "2 Lake Road", city: "Geneva", country: "CH" };

async function signUp(email: string): Promise<ApiClient> {
  const client = new ApiClient(csrf);
  await client.send(registerRoute.POST, {
    method: "POST",
    path: "/api/v1/auth/register",
    body: { email, password: PASSWORD },
  });
  await client.send(loginRoute.POST, {
    method: "POST",
    path: "/api/v1/auth/login",
    body: { email, password: PASSWORD },
  });
  return client;
}

async function placeOrder(client: ApiClient, key: string, email: string): Promise<string> {
  await client.send(itemsRoute.POST, {
    method: "POST",
    path: "/api/v1/cart/items",
    body: { variantId: "noire-longline-coat-ink", size: "M", quantity: 1 },
  });
  await client.send(shippingRoute.PUT, {
    method: "PUT",
    path: "/api/v1/cart/shipping",
    body: { shippingMethodId: "us-standard" },
  });
  const response = await client.send(checkoutRoute.POST, {
    method: "POST",
    path: "/api/v1/checkout",
    headers: { "idempotency-key": key },
    body: { email, shippingAddress: address },
  });
  expect(response.status).toBe(201);
  return (await json<{ order: { orderNumber: string } }>(response)).order.orderNumber;
}

describe("orders", () => {
  it("requires a signed-in customer to list orders", async () => {
    const anonymous = new ApiClient(csrf);
    const response = await anonymous.send(ordersRoute.GET, { path: "/api/v1/orders" });
    expect(response.status).toBe(401);
  });

  it("lists a customer's orders and shows one to its owner", async () => {
    const email = "owner.orders@example.com";
    const client = await signUp(email);
    const orderNumber = await placeOrder(client, "owner-order-key-1", email);

    const list = await json<{ items: { orderNumber: string }[] }>(
      await client.send(ordersRoute.GET, { path: "/api/v1/orders" }),
    );
    expect(list.items.map((order) => order.orderNumber)).toContain(orderNumber);

    const detail = await client.send(orderRoute.GET, {
      path: `/api/v1/orders/${orderNumber}`,
      params: { orderNumber },
    });
    expect(detail.status).toBe(200);
  });

  it("hides another customer's order behind a plain 404", async () => {
    const owner = await signUp("first.owner@example.com");
    const orderNumber = await placeOrder(owner, "private-order-key-1", "first.owner@example.com");

    const intruder = await signUp("nosy.neighbour@example.com");
    const response = await intruder.send(orderRoute.GET, {
      path: `/api/v1/orders/${orderNumber}`,
      params: { orderNumber },
    });
    expect(response.status).toBe(404);
    const list = await json<{ items: { orderNumber: string }[] }>(
      await intruder.send(ordersRoute.GET, { path: "/api/v1/orders" }),
    );
    expect(list.items.map((order) => order.orderNumber)).not.toContain(orderNumber);
  });

  it("lets a guest read the order with the cookie that placed it, and nobody else", async () => {
    const guest = new ApiClient(csrf);
    await guest.send(itemsRoute.POST, {
      method: "POST",
      path: "/api/v1/cart/items",
      body: { variantId: "noire-longline-coat-ink", size: "M", quantity: 1 },
    });
    await guest.send(shippingRoute.PUT, {
      method: "PUT",
      path: "/api/v1/cart/shipping",
      body: { shippingMethodId: "us-standard" },
    });
    const placed = await guest.send(checkoutRoute.POST, {
      method: "POST",
      path: "/api/v1/checkout",
      headers: { "idempotency-key": "guest-order-key-1" },
      body: { email: "guest.buyer@example.com", shippingAddress: address },
    });
    const orderNumber = (await json<{ order: { orderNumber: string } }>(placed)).order.orderNumber;

    const own = await guest.send(orderRoute.GET, {
      path: `/api/v1/orders/${orderNumber}`,
      params: { orderNumber },
    });
    expect(own.status).toBe(200);

    const stranger = new ApiClient(csrf);
    const other = await stranger.send(orderRoute.GET, {
      path: `/api/v1/orders/${orderNumber}`,
      params: { orderNumber },
    });
    expect(other.status).toBe(404);
  });

  it("rejects malformed order numbers before querying", async () => {
    const client = new ApiClient(csrf);
    const response = await client.send(orderRoute.GET, {
      path: "/api/v1/orders/not-an-order",
      params: { orderNumber: "not-an-order" },
    });
    expect(response.status).toBe(400);
  });
});
