import { randomBytes, timingSafeEqual } from "node:crypto";

export const CSRF_COOKIE = "vellum_csrf";
export const CSRF_HEADER = "x-csrf-token";

export function newCsrfToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Double-submit cookie check. The cookie is readable by our script (not httpOnly)
 * and must be echoed in a custom header, which a cross-site form cannot set.
 */
export function isValidDoubleSubmit(
  cookieValue: string | undefined,
  headerValue: string | null,
): boolean {
  if (!cookieValue || !headerValue) return false;
  const a = Buffer.from(cookieValue);
  const b = Buffer.from(headerValue);
  return a.length === b.length && timingSafeEqual(a, b);
}
