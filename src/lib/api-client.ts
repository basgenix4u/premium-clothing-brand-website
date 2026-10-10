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

/** Same-origin JSON GET. Relative URLs only, so the browser never targets another host. */
export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const init: RequestInit = { headers: { accept: "application/json" }, credentials: "same-origin" };
  if (signal) init.signal = signal;
  const response = await fetch(path, init);
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
