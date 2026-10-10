import { getServices } from "@/server/composition";
import { apiRoute, json } from "@/server/http/api";
import { SESSION_COOKIE } from "@/server/http/app-cookies";
import { readCookie } from "@/server/http/cookies";
import { UnauthorizedError } from "@/server/http/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute(async (request) => {
  const services = getServices();
  const user = await services.auth.currentUser(readCookie(request, SESSION_COOKIE));
  if (!user) throw new UnauthorizedError("Sign in to see your orders.");
  return json({ items: await services.orders.listForUser(user.id) });
});
