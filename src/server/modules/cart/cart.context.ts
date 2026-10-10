import { randomToken, sha256Hex } from "@/server/security/hash";
import { readCookie } from "@/server/http/cookies";
import { GUEST_COOKIE_NAME, guestCookie, SESSION_COOKIE } from "@/server/http/app-cookies";
import type { AuthService } from "@/server/modules/auth/auth.service";
import type { CartOwner } from "@/server/modules/cart/cart.owner";

export type ResolvedOwner = { owner: CartOwner | null; setCookies: string[] };
export type ResolvedWriteOwner = { owner: CartOwner; setCookies: string[] };

/**
 * Signed-in customers own their cart. Everyone else gets a guest cart keyed by a random
 * cookie. The raw token is never stored; only its SHA-256 hash is.
 */
export async function resolveCartOwner(
  request: Request,
  auth: AuthService,
  options: { create: boolean },
): Promise<ResolvedOwner> {
  const user = await auth.currentUser(readCookie(request, SESSION_COOKIE));
  if (user) return { owner: { type: "user", userId: user.id }, setCookies: [] };

  const guestToken = readCookie(request, GUEST_COOKIE_NAME);
  if (guestToken)
    return { owner: { type: "guest", tokenHash: sha256Hex(guestToken) }, setCookies: [] };

  if (!options.create) return { owner: null, setCookies: [] };
  const token = randomToken(32);
  return {
    owner: { type: "guest", tokenHash: sha256Hex(token) },
    setCookies: [guestCookie(token)],
  };
}

/** For writes: a guest cart is created on demand, so an owner is always returned. */
export async function resolveWriteOwner(
  request: Request,
  auth: AuthService,
): Promise<ResolvedWriteOwner> {
  const resolved = await resolveCartOwner(request, auth, { create: true });
  if (!resolved.owner) {
    throw new Error("resolveCartOwner must return an owner when create is true");
  }
  return { owner: resolved.owner, setCookies: resolved.setCookies };
}
