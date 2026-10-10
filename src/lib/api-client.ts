/** Error raised for any non-2xx API response. `message` is the RFC 9457 `detail` when present. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";
const CSRF_HEADER = "x-csrf-token";
const CSRF_PATH = "/api/v1/security/csrf";

let csrfToken: string | undefined;

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { accept: "application/json", ...init.headers },
    credentials: "same-origin",
  });
  if (!response.ok) {
    let detail: string | undefined;
    try {
      const problem = (await response.json()) as { detail?: string };
      detail = problem.detail;
    } catch {
      detail = undefined;
    }
    throw new ApiError(response.status, detail ?? FALLBACK_MESSAGE);
  }
  return (await response.json()) as T;
}

/** Same-origin JSON GET. Relative URLs only, so the browser never targets another host. */
export function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  return request<T>(path, signal ? { signal } : {});
}

async function getCsrfToken(refresh = false): Promise<string> {
  if (!csrfToken || refresh) {
    const body = await request<{ csrfToken: string }>(CSRF_PATH, { credentials: "same-origin" });
    csrfToken = body.csrfToken;
  }
  return csrfToken;
}

/**
 * Same-origin JSON POST with the double-submit CSRF header. One retry on a 403 covers a
 * token that expired while the tab was open.
 */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const send = async (token: string) =>
    request<T>(path, {
      method: "POST",
      headers: { "content-type": "application/json", [CSRF_HEADER]: token },
      body: JSON.stringify(body),
    });
  try {
    return await send(await getCsrfToken());
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return send(await getCsrfToken(true));
    }
    throw error;
  }
}
