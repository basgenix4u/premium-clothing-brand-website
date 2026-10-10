import { getServices } from "@/server/composition";
import { apiRoute, json } from "@/server/http/api";
import { clearGuestCookie, sessionCookie } from "@/server/http/app-cookies";
import { clientIpKey } from "@/server/http/client-ip";
import { readCookie } from "@/server/http/cookies";
import { GUEST_COOKIE_NAME } from "@/server/http/app-cookies";
import { readJson } from "@/server/http/request";
import { sha256Hex } from "@/server/security/hash";
import { loginSchema } from "@/server/modules/auth/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = apiRoute(async (request) => {
  const body = await readJson(request, loginSchema);
  const services = getServices();
  const session = await services.auth.login(body, {
    ipKey: clientIpKey(request),
    ...(request.headers.get("user-agent")
      ? { userAgent: request.headers.get("user-agent") ?? "" }
      : {}),
  });

  // Carry a guest bag into the account so nothing the shopper picked is lost.
  const guestToken = readCookie(request, GUEST_COOKIE_NAME);
  if (guestToken) {
    await services.cart.mergeGuestIntoUser(
      { type: "guest", tokenHash: sha256Hex(guestToken) },
      session.user.id,
    );
  }
  return json(
    { user: session.user, expiresAt: session.expiresAt.toISOString() },
    { cookies: [sessionCookie(session.token), clearGuestCookie()] },
  );
});
