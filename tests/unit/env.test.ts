import { describe, expect, it } from "vitest";
import { ConfigError, isSecureOrigin, parseEnv } from "@/server/config/env";

describe("parseEnv", () => {
  it("applies safe defaults when variables are absent", () => {
    expect(parseEnv({})).toEqual({
      NODE_ENV: "development",
      APP_URL: "http://localhost:3000",
      APP_VERSION: "0.1.0",
      LOG_LEVEL: "info",
      TRUST_PROXY: "false",
    });
  });

  it("accepts valid overrides", () => {
    const env = parseEnv({
      NODE_ENV: "production",
      APP_URL: "https://vellum.example",
      LOG_LEVEL: "warn",
    });
    expect(env.NODE_ENV).toBe("production");
    expect(env.APP_URL).toBe("https://vellum.example");
    expect(env.LOG_LEVEL).toBe("warn");
  });

  it("rejects an invalid value and names the key without echoing the value", () => {
    const secretLookalike = "not-a-real-url-secret-123";
    let caught: unknown;
    try {
      parseEnv({ APP_URL: secretLookalike });
    } catch (error: unknown) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(ConfigError);
    expect((caught as Error).message).toContain("APP_URL");
    expect((caught as Error).message).not.toContain(secretLookalike);
  });

  it("rejects an unknown log level and an invalid proxy flag", () => {
    expect(() => parseEnv({ LOG_LEVEL: "verbose" })).toThrow(ConfigError);
    expect(() => parseEnv({ TRUST_PROXY: "yes" })).toThrow(ConfigError);
  });

  it("detects secure origins for cookie flags", () => {
    expect(isSecureOrigin(parseEnv({ APP_URL: "https://vellum.example" }))).toBe(true);
    expect(isSecureOrigin(parseEnv({ APP_URL: "http://localhost:3000" }))).toBe(false);
  });
});
