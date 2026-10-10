import { getServices } from "@/server/composition";
import { apiRoute, json } from "@/server/http/api";
import { clearSessionCookie, SESSION_COOKIE } from "@/server/http/app-cookies";
import { readCookie } from "@/server/http/cookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = apiRoute(async (request) => {
  await getServices().auth.logout(readCookie(request, SESSION_COOKIE));
  return json({ loggedOut: true }, { cookies: [clearSessionCookie()] });
});
