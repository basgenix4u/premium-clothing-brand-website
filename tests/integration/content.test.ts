import { beforeAll, describe, expect, it } from "vitest";
import * as looksRoute from "@/app/api/v1/looks/route";
import * as journalRoute from "@/app/api/v1/journal/route";
import * as articleRoute from "@/app/api/v1/journal/[slug]/route";
import * as csrfRoute from "@/app/api/v1/security/csrf/route";
import { ApiClient, json } from "./helpers";

const client = new ApiClient(csrfRoute.GET);

type LookBody = {
  items: {
    slug: string;
    title: string;
    items: { slug: string; x: number; y: number; label: string }[];
  }[];
};

describe("GET /api/v1/looks", () => {
  beforeAll(async () => {
    await client.ensureCsrf();
  });

  it("returns the four curated looks in editorial order, with product references", async () => {
    const response = await client.send(looksRoute.GET, { path: "/api/v1/looks" });
    expect(response.status).toBe(200);
    const body = await json<LookBody>(response);
    expect(body.items).toHaveLength(4);
    expect(body.items[0]?.slug).toBe("city-editorial");
    expect(body.items.every((look) => look.items.length > 0)).toBe(true);
    expect(body.items[0]?.items[0]).toEqual(
      expect.objectContaining({ slug: "meridian-coat", label: "Coat" }),
    );
  });
});

describe("GET /api/v1/journal", () => {
  it("lists the three articles in editorial order without bodies", async () => {
    const response = await client.send(journalRoute.GET, { path: "/api/v1/journal" });
    expect(response.status).toBe(200);
    const body = await json<{ items: Record<string, unknown>[] }>(response);
    expect(body.items.map((article) => article.slug)).toEqual([
      "how-to-layer-without-bulk",
      "the-case-for-one-good-coat",
      "dressing-for-a-day-with-two-plans",
    ]);
    expect(body.items[0]).not.toHaveProperty("body");
  });
});

describe("GET /api/v1/journal/{slug}", () => {
  it("returns the full article with body paragraphs and related slugs", async () => {
    const response = await client.send(articleRoute.GET, {
      path: "/api/v1/journal/how-to-layer-without-bulk",
      params: { slug: "how-to-layer-without-bulk" },
    });
    expect(response.status).toBe(200);
    const body = await json<{ title: string; body: string[]; related: string[] }>(response);
    expect(body.title).toBe("How to layer without the bulk");
    expect(body.body.length).toBeGreaterThan(0);
    expect(Array.isArray(body.related)).toBe(true);
  });

  it("returns an RFC 9457 404 for an unknown story", async () => {
    const response = await client.send(articleRoute.GET, {
      path: "/api/v1/journal/no-such-story",
      params: { slug: "no-such-story" },
    });
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/problem+json");
  });

  it("rejects a malformed slug with a 400 before querying", async () => {
    const response = await client.send(articleRoute.GET, {
      path: "/api/v1/journal/Bad%20Slug",
      params: { slug: "Bad Slug" },
    });
    expect(response.status).toBe(400);
  });
});
