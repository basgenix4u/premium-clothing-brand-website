import { beforeAll, describe, expect, it } from "vitest";
import * as categoriesRoute from "@/app/api/v1/categories/route";
import * as productsRoute from "@/app/api/v1/products/route";
import * as productRoute from "@/app/api/v1/products/[slug]/route";
import * as csrfRoute from "@/app/api/v1/security/csrf/route";
import { ApiClient, json } from "./helpers";

type ProductPage = {
  items: { slug: string; category: { slug: string }; price: { amountMinor: number } }[];
  nextCursor: string | null;
};

const client = new ApiClient(csrfRoute.GET);

describe("GET /api/v1/categories", () => {
  it("lists the seven seeded categories in display order", async () => {
    const response = await client.send(categoriesRoute.GET, {
      path: "/api/v1/categories",
    });
    expect(response.status).toBe(200);
    const body = await json<{ items: { slug: string }[] }>(response);
    expect(body.items.map((item) => item.slug)).toEqual([
      "outerwear",
      "tailoring",
      "knitwear",
      "dresses",
      "essentials",
      "denim",
      "accessories",
    ]);
  });
});

describe("GET /api/v1/products", () => {
  it("returns the full published catalogue when asked for everything", async () => {
    const all: string[] = [];
    let cursor: string | null = null;
    do {
      const path: string = `/api/v1/products?limit=5${cursor ? `&cursor=${cursor}` : ""}`;
      const page: ProductPage = await json<ProductPage>(
        await client.send(productsRoute.GET, { path }),
      );
      for (const item of page.items) all.push(item.slug);
      cursor = page.nextCursor;
    } while (cursor);
    expect(all).toHaveLength(18);
    expect(new Set(all).size).toBe(18);
  });

  it("filters by category", async () => {
    const page = await json<ProductPage>(
      await client.send(productsRoute.GET, {
        path: "/api/v1/products?category=outerwear&limit=50",
      }),
    );
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((item) => item.category.slug === "outerwear")).toBe(true);
  });

  it("sorts by price ascending", async () => {
    const page = await json<ProductPage>(
      await client.send(productsRoute.GET, {
        path: "/api/v1/products?sort=price-asc&limit=100",
      }),
    );
    const prices = page.items.map((item) => item.price.amountMinor);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it("filters by price range in major units", async () => {
    const page = await json<ProductPage>(
      await client.send(productsRoute.GET, {
        path: "/api/v1/products?minPrice=100&maxPrice=200&limit=100",
      }),
    );
    expect(
      page.items.every(
        (item) => item.price.amountMinor >= 10_000 && item.price.amountMinor <= 20_000,
      ),
    ).toBe(true);
  });

  it("searches by name", async () => {
    const page = await json<ProductPage>(
      await client.send(productsRoute.GET, {
        path: "/api/v1/products?q=meridian&limit=50",
      }),
    );
    expect(page.items.some((item) => item.slug === "meridian-coat")).toBe(true);
  });

  it("returns 422 with field errors for an invalid limit", async () => {
    const response = await client.send(productsRoute.GET, {
      path: "/api/v1/products?limit=500",
    });
    expect(response.status).toBe(422);
    expect(response.headers.get("content-type")).toContain("application/problem+json");
    const problem = await json<{ status: number; errors?: Record<string, unknown[]> }>(response);
    expect(problem.status).toBe(422);
    expect(problem.errors?.limit).toBeDefined();
  });

  it("returns 400 for a tampered cursor", async () => {
    const response = await client.send(productsRoute.GET, {
      path: "/api/v1/products?cursor=ZZZZ",
    });
    expect(response.status).toBe(400);
  });
});

describe("GET /api/v1/products/{slug}", () => {
  beforeAll(async () => {
    await client.ensureCsrf();
  });

  it("returns variants with sizes and related products", async () => {
    const response = await client.send(productRoute.GET, {
      path: "/api/v1/products/meridian-coat",
      params: { slug: "meridian-coat" },
    });
    expect(response.status).toBe(200);
    const body = await json<{
      product: {
        name: string;
        variants: { id: string; sizes: { size: string; stock: number }[] }[];
      };
      related: unknown[];
    }>(response);
    expect(body.product.name).toBeTruthy();
    expect(body.product.variants.length).toBeGreaterThan(0);
    expect(body.product.variants[0]?.sizes.length).toBeGreaterThan(0);
    expect(body.related.length).toBeLessThanOrEqual(4);
  });

  it("returns 404 problem details for an unknown product", async () => {
    const response = await client.send(productRoute.GET, {
      path: "/api/v1/products/does-not-exist",
      params: { slug: "does-not-exist" },
    });
    expect(response.status).toBe(404);
    expect(await json(response)).toMatchObject({ status: 404, title: "Not found" });
  });

  it("rejects malformed slugs before touching the database", async () => {
    const response = await client.send(productRoute.GET, {
      path: "/api/v1/products/Bad%20Slug!",
      params: { slug: "Bad Slug!" },
    });
    expect(response.status).toBe(400);
  });
});
