import { describe, expect, it } from "vitest";
import {
  addItemSchema,
  applyPromoSchema,
  shippingSchema,
  updateItemSchema,
} from "@/server/modules/cart/cart.schemas";
import { productQuerySchema, slugSchema } from "@/server/modules/catalog/catalog.schemas";
import {
  checkoutSchema,
  IDEMPOTENCY_KEY_PATTERN,
  shippingAddressSchema,
} from "@/server/modules/checkout/checkout.schemas";

const address = {
  fullName: "Grace Hopper",
  line1: "1 Harbour Way",
  city: "Arlington",
  country: "us",
};

describe("catalogue query schema", () => {
  it("applies the default sort and page size", () => {
    expect(productQuerySchema.parse({})).toMatchObject({ sort: "featured", limit: 24 });
  });

  it("coerces numeric query strings", () => {
    const parsed = productQuerySchema.parse({ limit: "12", minPrice: "10.5", maxPrice: "300" });
    expect(parsed).toMatchObject({ limit: 12, minPrice: 10.5, maxPrice: 300 });
  });

  it("trims free-text filters and rejects blank ones", () => {
    expect(productQuerySchema.parse({ q: "  coat  " }).q).toBe("coat");
    expect(() => productQuerySchema.parse({ q: "   " })).toThrow();
  });

  it.each([
    ["a limit of zero", { limit: "0" }],
    ["a limit above 100", { limit: "101" }],
    ["an unknown sort key", { sort: "cheapest" }],
    ["an unknown audience", { audience: "children" }],
    ["a negative price", { minPrice: "-1" }],
    ["a cursor with illegal characters", { cursor: "bad cursor!" }],
  ])("rejects %s", (_label, input) => {
    expect(productQuerySchema.safeParse(input).success).toBe(false);
  });

  it("validates slugs as lowercase kebab case", () => {
    expect(slugSchema.safeParse("meridian-coat").success).toBe(true);
    expect(slugSchema.safeParse("Meridian Coat").success).toBe(false);
    expect(slugSchema.safeParse("double--dash").success).toBe(false);
    expect(slugSchema.safeParse("-leading").success).toBe(false);
  });
});

describe("cart schemas", () => {
  it("defaults the quantity to one and trims the variant id", () => {
    expect(addItemSchema.parse({ variantId: " meridian-coat-camel ", size: "M" })).toEqual({
      variantId: "meridian-coat-camel",
      size: "M",
      quantity: 1,
    });
  });

  it.each([0, 11, 1.5])("rejects a line quantity of %s", (quantity) => {
    expect(addItemSchema.safeParse({ variantId: "x-y", size: "M", quantity }).success).toBe(false);
  });

  it("rejects unexpected fields such as a client-supplied price", () => {
    const result = addItemSchema.safeParse({ variantId: "x-y", size: "M", priceMinor: 1 });
    expect(result.success).toBe(false);
  });

  it("requires a whole-number quantity for updates", () => {
    expect(updateItemSchema.safeParse({ quantity: 3 }).success).toBe(true);
    expect(updateItemSchema.safeParse({}).success).toBe(false);
  });

  it("trims promo codes and rejects empty ones", () => {
    expect(applyPromoSchema.parse({ code: "  welcome10 " }).code).toBe("welcome10");
    expect(applyPromoSchema.safeParse({ code: "   " }).success).toBe(false);
  });

  it("requires a shipping method id", () => {
    expect(shippingSchema.safeParse({ shippingMethodId: "us-express" }).success).toBe(true);
    expect(shippingSchema.safeParse({ shippingMethodId: "" }).success).toBe(false);
  });
});

describe("checkout schemas", () => {
  it("normalises the country code to upper case", () => {
    expect(shippingAddressSchema.parse(address).country).toBe("US");
  });

  it("rejects country names and three-letter codes", () => {
    expect(shippingAddressSchema.safeParse({ ...address, country: "USA" }).success).toBe(false);
    expect(shippingAddressSchema.safeParse({ ...address, country: "United States" }).success).toBe(
      false,
    );
  });

  it("rejects unknown address fields", () => {
    expect(shippingAddressSchema.safeParse({ ...address, role: "admin" }).success).toBe(false);
  });

  it("requires a name, a line and a city", () => {
    expect(shippingAddressSchema.safeParse({ ...address, fullName: "" }).success).toBe(false);
    expect(shippingAddressSchema.safeParse({ ...address, line1: "  " }).success).toBe(false);
    expect(shippingAddressSchema.safeParse({ ...address, city: "" }).success).toBe(false);
  });

  it("validates the whole checkout payload and rejects extra keys", () => {
    const valid = checkoutSchema.parse({ email: "Grace@Example.com", shippingAddress: address });
    expect(valid.email).toBe("grace@example.com");
    expect(
      checkoutSchema.safeParse({ email: "not-an-email", shippingAddress: address }).success,
    ).toBe(false);
    expect(
      checkoutSchema.safeParse({ email: "grace@example.com", shippingAddress: address, total: 1 })
        .success,
    ).toBe(false);
  });

  it("accepts idempotency keys of 8 to 80 safe characters only", () => {
    expect(IDEMPOTENCY_KEY_PATTERN.test("abcdefgh")).toBe(true);
    expect(IDEMPOTENCY_KEY_PATTERN.test("a".repeat(80))).toBe(true);
    expect(IDEMPOTENCY_KEY_PATTERN.test("short")).toBe(false);
    expect(IDEMPOTENCY_KEY_PATTERN.test("a".repeat(81))).toBe(false);
    expect(IDEMPOTENCY_KEY_PATTERN.test("has space key")).toBe(false);
  });
});
