export type CookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Lax" | "Strict";
  path?: string;
  maxAgeSeconds?: number;
};

/** Reads one cookie from a request's Cookie header. Values are base64url, so no decoding is needed. */
export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) {
      const value = part.slice(index + 1).trim();
      return value.length > 0 ? value : undefined;
    }
  }
  return undefined;
}

export function serializeCookie(name: string, value: string, options: CookieOptions): string {
  const parts = [`${name}=${value}`, `Path=${options.path ?? "/"}`, `SameSite=${options.sameSite}`];
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.maxAgeSeconds !== undefined) parts.push(`Max-Age=${options.maxAgeSeconds}`);
  return parts.join("; ");
}

export function clearCookie(
  name: string,
  options: Pick<CookieOptions, "secure" | "httpOnly" | "sameSite">,
): string {
  return serializeCookie(name, "", { ...options, maxAgeSeconds: 0 });
}
