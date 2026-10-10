import { describe, expect, it } from "vitest";
import { GET as liveGET } from "@/app/api/v1/health/live/route";
import { GET as smokeGET } from "@/app/api/v1/health/smoke/route";

describe("GET /api/v1/health/smoke", () => {
  it("returns 200 with a service report and no-store caching", async () => {
    const response = smokeGET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toMatchObject({
      status: "ok",
      service: "vellum-storefront",
      checks: { configuration: "ok" },
    });
    expect(typeof body.timestamp).toBe("string");
    expect(Number.isNaN(Date.parse(body.timestamp as string))).toBe(false);
  });
});

describe("GET /api/v1/health/live", () => {
  it("returns 200 ok", async () => {
    const response = liveGET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});
