import { describe, expect, it, vi } from "vitest";
import {
  CatalogService,
  decodeCursor,
  encodeCursor,
} from "@/server/modules/catalog/catalog.service";
import type { CatalogRepository } from "@/server/modules/catalog/catalog.repository";
import type { ProductQuery } from "@/server/modules/catalog/catalog.schemas";

// The mappers are exercised by the integration suite. Here they become identity functions
// so the service's paging and error rules can be tested on plain fixtures.
vi.mock("@/server/modules/catalog/catalog.mapper", () => ({
  toProductSummary: (row: { slug: string }) => ({ slug: row.slug }),
  toProductDetail: (row: { slug: string }) => ({ slug: row.slug, detail: true }),
}));

type Row = { slug: string; category: { slug: string } };

const query = (overrides: Partial<ProductQuery> = {}): ProductQuery => ({
  sort: "featured",
  limit: 2,
  ...overrides,
});

const rows = (count: number): Row[] =>
  Array.from({ length: count }, (_, index) => ({
    slug: `piece-${index}`,
    category: { slug: "outerwear" },
  }));

function fakeRepository(overrides: Partial<Record<keyof CatalogRepository, unknown>> = {}) {
  const repository = {
    listCategories: vi.fn().mockResolvedValue([
      {
        slug: "outerwear",
        name: "Outerwear",
        blurb: "Coats",
        imageUrl: "/o.jpg",
        sortOrder: 0,
        id: "x",
      },
    ]),
    listProducts: vi.fn().mockResolvedValue(rows(3)),
    findPublishedBySlug: vi.fn().mockResolvedValue(null),
    listRelated: vi.fn().mockResolvedValue(rows(6)),
    ...overrides,
  };
  return { repository, service: new CatalogService(repository as unknown as CatalogRepository) };
}

describe("cursor encoding", () => {
  it("round-trips offsets", () => {
    expect(decodeCursor(encodeCursor(48))).toBe(48);
  });

  it("treats a missing cursor as the first page", () => {
    expect(decodeCursor(undefined)).toBe(0);
  });

  it("rejects cursors that do not decode to a number", () => {
    expect(() => decodeCursor(Buffer.from("not-a-number").toString("base64url"))).toThrow(
      "The cursor is not valid.",
    );
  });
});

describe("CatalogService", () => {
  it("lists categories in the shape the storefront needs", async () => {
    const { service } = fakeRepository();
    expect(await service.listCategories()).toEqual([
      { slug: "outerwear", name: "Outerwear", blurb: "Coats", imageUrl: "/o.jpg" },
    ]);
  });

  it("returns a next cursor only when one more row exists", async () => {
    const { repository, service } = fakeRepository();
    const page = await service.listProducts(query({ limit: 2 }));
    expect(page.items.map((item) => item.slug)).toEqual(["piece-0", "piece-1"]);
    expect(page.nextCursor).not.toBeNull();
    expect(decodeCursor(page.nextCursor ?? undefined)).toBe(2);
    expect(repository.listProducts).toHaveBeenCalledWith(expect.objectContaining({ limit: 2 }), 0);
  });

  it("returns no next cursor on the last page", async () => {
    const { service } = fakeRepository({ listProducts: vi.fn().mockResolvedValue(rows(2)) });
    const page = await service.listProducts(query({ limit: 2 }));
    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBeNull();
  });

  it("queries from the decoded cursor offset", async () => {
    const { repository, service } = fakeRepository();
    await service.listProducts(query({ limit: 2, cursor: encodeCursor(20) }));
    expect(repository.listProducts).toHaveBeenCalledWith(expect.anything(), 20);
  });

  it("returns 404 for an unpublished or unknown product", async () => {
    const { service } = fakeRepository();
    await expect(service.getProduct("ghost")).rejects.toMatchObject({ status: 404 });
  });

  it("asks the repository for at most four related pieces", async () => {
    const product: Row = { slug: "meridian-coat", category: { slug: "outerwear" } };
    // The repository applies the limit, so the fake honours it the way the real query does.
    const { repository, service } = fakeRepository({
      findPublishedBySlug: vi.fn().mockResolvedValue(product),
      listRelated: vi.fn().mockResolvedValue(rows(4)),
    });
    const result = await service.getProduct("meridian-coat");
    expect(result.product).toEqual({ slug: "meridian-coat", detail: true });
    expect(result.related).toHaveLength(4);
    expect(repository.listRelated).toHaveBeenCalledWith("meridian-coat", "outerwear", 4);
  });
});
