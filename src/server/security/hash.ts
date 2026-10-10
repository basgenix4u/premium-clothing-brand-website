import { createHash, randomBytes } from "node:crypto";

/** SHA-256 hex digest. Used so raw tokens are never stored at rest. */
export const sha256Hex = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

/** Cryptographically secure URL-safe random token. */
export const randomToken = (bytes = 32): string => randomBytes(bytes).toString("base64url");
