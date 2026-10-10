import { describe, expect, it } from "vitest";
import { apiRoute, json } from "@/server/http/api";
import { ConflictError } from "@/server/http/errors";
import { CSRF_COOKIE, CSRF_HEADER } from "@/server/http/csrf";

const handler = apiRoute(() => Promise.resolve(json({ ok: true })));
const failing = apiRoute(() => {
  throw new ConflictError("Only 1 left.");
});
const crashing = apiRoute(() => {
  throw new Error("database password is hunter2");
});
const withParams = apiRoute<{ id: string }>((_req, { params }) =>
  Promise.resolve(json({ id: params.id })),
);

const post = (headers: Record<string, string> = {}) =>
  new Request("http://localhost:3000/api/v1/thing", { method: "POST", headers });

describe("apiRoute pipeline", () => {
  it("allows safe methods without a CSRF token", async () => {
    const response = await handler(new Request("http://localhost:3000/api/v1/thing"));
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-Id")).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("rejects unsafe methods without a CSRF token with a 403 problem response", async () => {
    const response = await handler(post());
    expect(response.status).toBe(403);
    expect(response.headers.get("content-type")).toContain("application/problem+json");
    const body = (await response.json()) as {
      title: string;
      status: number;
      instance: string;
      requestId: string;
    };
    expect(body).toMatchObject({ status: 403, title: "Forbidden", instance: "/api/v1/thing" });
    expect(body.requestId).toBeTruthy();
  });

  it("accepts unsafe methods when the double-submit token matches", async () => {
    const token = "tok-abcdefghijklmnop";
    const response = await handler(
      post({
        cookie: `${CSRF_COOKIE}=${token}`,
        [CSRF_HEADER]: token,
        "sec-fetch-site": "same-origin",
      }),
    );
    expect(response.status).toBe(200);
  });

  it("rejects cross-origin requests even with a valid token", async () => {
    const token = "tok-abcdefghijklmnop";
    const response = await handler(
      post({
        cookie: `${CSRF_COOKIE}=${token}`,
        [CSRF_HEADER]: token,
        origin: "https://evil.example",
      }),
    );
    expect(response.status).toBe(403);
  });

  it("rejects cross-site fetch metadata", async () => {
    const token = "tok-abcdefghijklmnop";
    const response = await handler(
      post({
        cookie: `${CSRF_COOKIE}=${token}`,
        [CSRF_HEADER]: token,
        "sec-fetch-site": "cross-site",
      }),
    );
    expect(response.status).toBe(403);
  });

  it("maps application errors to their status and keeps the detail safe", async () => {
    const response = await failing(new Request("http://localhost:3000/api/v1/x"));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      status: 409,
      title: "Conflict",
      detail: "Only 1 left.",
    });
  });

  it("never leaks internal error messages for unexpected failures", async () => {
    const response = await crashing(new Request("http://localhost:3000/api/v1/x"));
    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).not.toContain("hunter2");
    expect(text).toContain("Internal server error");
  });

  it("passes awaited route params to the handler", async () => {
    const response = await withParams(new Request("http://localhost:3000/api/v1/x/42"), {
      params: Promise.resolve({ id: "42" }),
    });
    expect(await response.json()).toEqual({ id: "42" });
  });
});
