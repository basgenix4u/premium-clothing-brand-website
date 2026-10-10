import { describe, expect, it } from "vitest";
import { z } from "zod";
import { isValidDoubleSubmit, newCsrfToken } from "@/server/http/csrf";
import { clearCookie, readCookie, serializeCookie } from "@/server/http/cookies";
import { FixedWindowRateLimiter } from "@/server/http/rate-limit";
import { readJson, parseQuery, MAX_JSON_BYTES } from "@/server/http/request";
import type { AppError } from "@/server/http/errors";
import { BadRequestError, RateLimitedError, ValidationFailedError } from "@/server/http/errors";
import { decodeCursor, encodeCursor } from "@/server/modules/catalog/catalog.service";
import { generateOrderNumber } from "@/server/modules/checkout/checkout.service";
import { sha256Hex, randomToken } from "@/server/security/hash";

const jsonRequest = (body: string, contentType = "application/json") =>
  new Request("http://localhost/x", {
    method: "POST",
    headers: { "content-type": contentType },
    body,
  });

describe("CSRF double-submit check", () => {
  it("accepts matching cookie and header", () => {
    const token = newCsrfToken();
    expect(isValidDoubleSubmit(token, token)).toBe(true);
  });

  it("rejects missing, mismatched or different-length values", () => {
    expect(isValidDoubleSubmit(undefined, "abc")).toBe(false);
    expect(isValidDoubleSubmit("abc", null)).toBe(false);
    expect(isValidDoubleSubmit("abc", "abd")).toBe(false);
    expect(isValidDoubleSubmit("abc", "abcd")).toBe(false);
  });
});

describe("cookies", () => {
  it("reads a named cookie from a multi-cookie header", () => {
    const request = new Request("http://localhost", {
      headers: { cookie: "a=1; vellum_session=tok_123; b=2" },
    });
    expect(readCookie(request, "vellum_session")).toBe("tok_123");
    expect(readCookie(request, "missing")).toBeUndefined();
  });

  it("serialises security attributes", () => {
    const cookie = serializeCookie("s", "v", {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      maxAgeSeconds: 60,
    });
    expect(cookie).toBe("s=v; Path=/; SameSite=Lax; HttpOnly; Secure; Max-Age=60");
  });

  it("clears cookies with Max-Age=0", () => {
    expect(clearCookie("s", { httpOnly: true, secure: false, sameSite: "Strict" })).toContain(
      "Max-Age=0",
    );
  });
});

describe("FixedWindowRateLimiter", () => {
  it("allows up to the limit, then blocks until the window resets", () => {
    let now = 0;
    const limiter = new FixedWindowRateLimiter(2, 60_000, () => now);
    expect(limiter.consume("k").allowed).toBe(true);
    expect(limiter.consume("k").allowed).toBe(true);
    const blocked = limiter.consume("k");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(60);
    now = 60_001;
    expect(limiter.consume("k").allowed).toBe(true);
  });

  it("tracks keys independently and supports reset", () => {
    const limiter = new FixedWindowRateLimiter(1, 60_000, () => 0);
    expect(limiter.consume("a").allowed).toBe(true);
    expect(limiter.consume("b").allowed).toBe(true);
    expect(limiter.consume("a").allowed).toBe(false);
    limiter.reset("a");
    expect(limiter.consume("a").allowed).toBe(true);
  });
});

describe("readJson", () => {
  const schema = z.object({ name: z.string() }).strict();

  it("parses a valid JSON body", async () => {
    expect(await readJson(jsonRequest('{"name":"ok"}'), schema)).toEqual({ name: "ok" });
  });

  it("rejects the wrong content type with 415", async () => {
    await expect(readJson(jsonRequest("{}", "text/plain"), schema)).rejects.toMatchObject({
      status: 415,
    });
  });

  it("rejects malformed JSON with 400", async () => {
    await expect(readJson(jsonRequest("{nope"), schema)).rejects.toBeInstanceOf(BadRequestError);
  });

  it("rejects oversized bodies with 413", async () => {
    const big = JSON.stringify({ name: "x".repeat(MAX_JSON_BYTES) });
    await expect(readJson(jsonRequest(big), schema)).rejects.toMatchObject({ status: 413 });
  });

  it("reports field-level validation errors", async () => {
    const error = await readJson(jsonRequest('{"name":1,"extra":true}'), schema).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ValidationFailedError);
    expect((error as AppError).extensions).toHaveProperty("errors");
  });
});

describe("parseQuery", () => {
  it("validates and coerces query parameters", () => {
    const schema = z.object({ limit: z.coerce.number().int().max(10) });
    expect(parseQuery(new URL("http://x/?limit=5"), schema)).toEqual({ limit: 5 });
    expect(() => parseQuery(new URL("http://x/?limit=50"), schema)).toThrow(ValidationFailedError);
  });
});

describe("error classes", () => {
  it("exposes retry guidance on rate limiting", () => {
    const error = new RateLimitedError(30);
    expect(error.status).toBe(429);
    expect(error.extensions).toEqual({ retryAfterSeconds: 30 });
  });
});

describe("catalog cursor", () => {
  it("round-trips an offset", () => {
    expect(decodeCursor(encodeCursor(48))).toBe(48);
    expect(decodeCursor(undefined)).toBe(0);
  });

  it("rejects tampered cursors", () => {
    expect(() => decodeCursor(Buffer.from("not-a-number").toString("base64url"))).toThrow(
      BadRequestError,
    );
  });
});

describe("order numbers and hashing", () => {
  it("creates date-prefixed order numbers from an unambiguous alphabet", () => {
    const number = generateOrderNumber(new Date("2026-10-10T08:00:00Z"));
    expect(number).toMatch(/^VLM-20261010-[A-HJ-NP-Z2-9]{6}$/);
  });

  it("hashes deterministically and generates unique tokens", () => {
    expect(sha256Hex("abc")).toBe(sha256Hex("abc"));
    expect(sha256Hex("abc")).toHaveLength(64);
    expect(randomToken()).not.toBe(randomToken());
  });
});
