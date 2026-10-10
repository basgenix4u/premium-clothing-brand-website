import { describe, expect, it } from "vitest";
import { hashPassword, verifyDecoy, verifyPassword } from "@/server/modules/auth/password";
import { registerSchema } from "@/server/modules/auth/schemas";

describe("password hashing", () => {
  it("produces an argon2id hash that verifies only the original password", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(hash, "correct horse battery")).toBe(true);
    expect(await verifyPassword(hash, "wrong horse battery")).toBe(false);
  });

  it("returns false for a malformed stored hash instead of throwing", async () => {
    expect(await verifyPassword("not-a-hash", "anything")).toBe(false);
  });

  it("decoy verification always fails", async () => {
    expect(await verifyDecoy("whatever")).toBe(false);
  });
});

describe("registerSchema", () => {
  it("normalises the email and accepts a 12-character passphrase", () => {
    const parsed = registerSchema.parse({ email: "  Ada@Example.COM ", password: "twelve chars" });
    expect(parsed.email).toBe("ada@example.com");
  });

  it("rejects passwords shorter than 12 characters", () => {
    const result = registerSchema.safeParse({ email: "a@b.co", password: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects unknown fields (mass-assignment protection)", () => {
    const result = registerSchema.safeParse({
      email: "a@b.co",
      password: "twelve chars",
      role: "ADMIN",
    });
    expect(result.success).toBe(false);
  });

  it("rejects malformed emails", () => {
    expect(
      registerSchema.safeParse({ email: "not-an-email", password: "twelve chars" }).success,
    ).toBe(false);
  });
});
