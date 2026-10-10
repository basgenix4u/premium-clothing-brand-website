import { isSecureOrigin } from "@/server/config/env";
import { clearCookie, serializeCookie } from "@/server/http/cookies";
import { CSRF_COOKIE } from "@/server/http/csrf";

export const SESSION_COOKIE = "vellum_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
export const CSRF_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
export const GUEST_COOKIE_NAME = "vellum_guest";
export const GUEST_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const base = () => ({ secure: isSecureOrigin() });

export const sessionCookie = (token: string): string =>
  serializeCookie(SESSION_COOKIE, token, {
    ...base(),
    httpOnly: true,
    sameSite: "Lax",
    maxAgeSeconds: SESSION_MAX_AGE_SECONDS,
  });

export const clearSessionCookie = (): string =>
  clearCookie(SESSION_COOKIE, { ...base(), httpOnly: true, sameSite: "Lax" });

export const guestCookie = (token: string): string =>
  serializeCookie(GUEST_COOKIE_NAME, token, {
    ...base(),
    httpOnly: true,
    sameSite: "Lax",
    maxAgeSeconds: GUEST_MAX_AGE_SECONDS,
  });

export const clearGuestCookie = (): string =>
  clearCookie(GUEST_COOKIE_NAME, { ...base(), httpOnly: true, sameSite: "Lax" });

/** Readable by our script on purpose (double-submit pattern). Strict same-site. */
export const csrfCookie = (token: string): string =>
  serializeCookie(CSRF_COOKIE, token, {
    ...base(),
    httpOnly: false,
    sameSite: "Strict",
    maxAgeSeconds: CSRF_MAX_AGE_SECONDS,
  });
