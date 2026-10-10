import { randomUUID } from "node:crypto";
import type { Logger } from "pino";
import { getEnv } from "@/server/config/env";
import { getLogger } from "@/server/logging/logger";
import { AppError, ForbiddenError, RateLimitedError } from "@/server/http/errors";
import { CSRF_COOKIE, CSRF_HEADER, isValidDoubleSubmit } from "@/server/http/csrf";
import { readCookie } from "@/server/http/cookies";
import { problem, type ProblemDetails } from "@/shared/problem";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export type ApiParams = Record<string, string>;

export type ApiContext<P extends ApiParams> = { params: P; requestId: string; log: Logger };

export type ApiHandler<P extends ApiParams> = (
  request: Request,
  ctx: ApiContext<P>,
) => Promise<Response>;

type RouteOptions = {
  /** Only for machine-to-machine endpoints that authenticate with a signature instead. */
  csrfExempt?: boolean;
};

/**
 * Wraps a route handler with the cross-cutting pipeline:
 * request id, structured logging, CSRF and origin checks for unsafe methods,
 * and RFC 9457 problem responses for every failure.
 */
export function apiRoute<P extends ApiParams = ApiParams>(
  handler: ApiHandler<P>,
  options: RouteOptions = {},
) {
  return async (request: Request, context?: { params: Promise<P> }): Promise<Response> => {
    const requestId = randomUUID();
    const log = getLogger().child({
      requestId,
      method: request.method,
      path: new URL(request.url).pathname,
    });
    try {
      if (UNSAFE_METHODS.has(request.method) && !options.csrfExempt) {
        assertSameOriginAndCsrf(request);
      }
      const params = ((await context?.params) ?? {}) as P;
      const response = await handler(request, { params, requestId, log });
      response.headers.set("X-Request-Id", requestId);
      return response;
    } catch (error: unknown) {
      return errorResponse(error, requestId, request, log);
    }
  };
}

/** Standard JSON success response. Cookies are appended as individual Set-Cookie headers. */
export function json<T>(body: T, init: { status?: number; cookies?: string[] } = {}): Response {
  const headers = new Headers({ "Cache-Control": "no-store" });
  for (const cookie of init.cookies ?? []) headers.append("Set-Cookie", cookie);
  return Response.json(body, { status: init.status ?? 200, headers });
}

export function assertSameOriginAndCsrf(request: Request): void {
  const allowedOrigin = new URL(getEnv().APP_URL).origin;
  const origin = request.headers.get("origin");
  if (origin && origin !== allowedOrigin) {
    throw new ForbiddenError("Cross-origin requests are not allowed.");
  }
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    throw new ForbiddenError("Cross-site requests are not allowed.");
  }
  const cookieToken = readCookie(request, CSRF_COOKIE);
  if (!isValidDoubleSubmit(cookieToken, request.headers.get(CSRF_HEADER))) {
    throw new ForbiddenError("Missing or invalid CSRF token. Fetch /api/v1/security/csrf first.");
  }
}

function errorResponse(error: unknown, requestId: string, request: Request, log: Logger): Response {
  const instance = new URL(request.url).pathname;
  if (error instanceof AppError) {
    if (error.status >= 500) log.error({ err: error }, error.title);
    else log.info({ status: error.status, title: error.title }, "request rejected");
    const body: ProblemDetails & Record<string, unknown> = {
      ...problem(error.status, error.title, error.detail),
      instance,
      requestId,
      ...(error.extensions ?? {}),
    };
    const headers: Record<string, string> = {
      "Content-Type": "application/problem+json",
      "Cache-Control": "no-store",
      "X-Request-Id": requestId,
    };
    if (error instanceof RateLimitedError) headers["Retry-After"] = String(error.retryAfterSeconds);
    return Response.json(body, { status: error.status, headers });
  }
  log.error({ err: error }, "unhandled error");
  const body: ProblemDetails & Record<string, unknown> = {
    ...problem(500, "Internal server error"),
    instance,
    requestId,
  };
  return Response.json(body, {
    status: 500,
    headers: {
      "Content-Type": "application/problem+json",
      "Cache-Control": "no-store",
      "X-Request-Id": requestId,
    },
  });
}
