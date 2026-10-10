import { describe, expect, it } from "vitest";
import * as csrfRoute from "@/app/api/v1/security/csrf/route";
import * as readyRoute from "@/app/api/v1/health/ready/route";
import * as liveRoute from "@/app/api/v1/health/live/route";
import * as unknownRoute from "@/app/api/[...slug]/route";
import { ApiClient, json } from "./helpers";

const client = new ApiClient(csrfRoute.GET);

describe("platform endpoints", () => {
  it("reports liveness without touching the database", async () => {
    const response = liveRoute.GET();
    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({ status: "ok" });
  });

  it("reports readiness when PostgreSQL answers", async () => {
    const response = await client.send(readyRoute.GET, { path: "/api/v1/health/ready" });
    expect(response.status).toBe(200);
    expect(await json(response)).toMatchObject({ status: "ready", checks: { database: "ok" } });
  });

  it("answers unknown API paths with an RFC 9457 problem, not an HTML page", async () => {
    const response = await client.send(unknownRoute.GET, {
      path: "/api/v1/does/not/exist",
    });
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/problem+json");
    expect(await json(response)).toMatchObject({ status: 404, title: "Not found" });
  });
});
