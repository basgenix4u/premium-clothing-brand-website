import { apiRoute, json } from "@/server/http/api";
import { csrfCookie } from "@/server/http/app-cookies";
import { CSRF_COOKIE, newCsrfToken } from "@/server/http/csrf";
import { readCookie } from "@/server/http/cookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Issues the double-submit CSRF token. Clients echo it in the X-CSRF-Token header. */
export const GET = apiRoute((request) => {
  const token = readCookie(request, CSRF_COOKIE) ?? newCsrfToken();
  return Promise.resolve(json({ csrfToken: token }, { cookies: [csrfCookie(token)] }));
});
