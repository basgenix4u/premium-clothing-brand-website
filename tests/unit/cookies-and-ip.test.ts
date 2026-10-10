import { beforeEach, describe, expect, it, vi } from "vitest";

const env = vi.hoisted(() => ({ secure: false, trustProxy: "false" }));

vi.mock("@/server/config/env", () => ({
  isSecureOrigin: () => env.secure,
  getEnv: () => ({ TRUST_PROXY: env.trustProxy }),
}));

import {
  clearGuestCookie,
  clearSessionCookie,
  csrfCookie,
  guestCookie,
  sessionCookie,
} from "@/server/http/app-cookies";
import { clientIpKey } from "@/server/http/client-ip";

beforeEach(() => {
  env.secure = false;
  env.trustProxy = "false";
});

describe("session and guest cookies", () => {
  it("issues the session cookie httpOnly, Lax, for seven days", () => {
    const cookie = sessionCookie("token-abc");
    expect(cookie).toBe("vellum_session=token-abc; Path=/; SameSite=Lax; HttpOnly; Max-Age=604800");
  });

  it("issues the guest cookie httpOnly, Lax, for thirty days", () => {
    expect(guestCookie("guest-1")).toBe(
      "vellum_guest=guest-1; Path=/; SameSite=Lax; HttpOnly; Max-Age=2592000",
    );
  });

  it("clears both cookies by expiring them immediately", () => {
    expect(clearSessionCookie()).toContain("vellum_session=;");
    expect(clearSessionCookie()).toContain("Max-Age=0");
    expect(clearGuestCookie()).toContain("vellum_guest=;");
    expect(clearGuestCookie()).toContain("Max-Age=0");
  });

  it("adds the Secure flag on HTTPS origins only", () => {
    expect(sessionCookie("t")).not.toContain("Secure");
    env.secure = true;
    expect(sessionCookie("t")).toContain("Secure");
    expect(guestCookie("g")).toContain("Secure");
    expect(clearSessionCookie()).toContain("Secure");
  });
});

describe("CSRF cookie", () => {
  it("is readable by the storefront script (double-submit) and strictly same-site", () => {
    const cookie = csrfCookie("csrf-1");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).not.toContain("HttpOnly");
    expect(cookie).toContain("Max-Age=604800");
  });
});

describe("clientIpKey", () => {
  const request = (forwarded?: string) =>
    new Request("http://localhost:3000/api/v1/x", {
      headers: forwarded === undefined ? {} : { "x-forwarded-for": forwarded },
    });

  it("ignores X-Forwarded-For unless a trusted proxy is configured", () => {
    expect(clientIpKey(request("203.0.113.9"))).toBe("direct");
  });

  it("uses the first forwarded address when the proxy is trusted", () => {
    env.trustProxy = "true";
    expect(clientIpKey(request("203.0.113.9, 10.0.0.1"))).toBe("203.0.113.9");
  });

  it("falls back to a shared bucket when the header is missing or empty", () => {
    env.trustProxy = "true";
    expect(clientIpKey(request())).toBe("unknown");
    expect(clientIpKey(request("  ,10.0.0.1"))).toBe("unknown");
  });

  it("caps very long forwarded values so keys stay bounded", () => {
    env.trustProxy = "true";
    expect(clientIpKey(request("a".repeat(300))).length).toBe(64);
  });
});
