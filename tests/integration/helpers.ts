import type { PrismaClient } from "../../src/server/db/generated/prisma/client";
import { getDb } from "../../src/server/db/client";

/**
 * Route handlers are plain functions, so tests call them directly with Web Request objects.
 * `never` as the context type lets any route signature be passed in.
 */
export type RouteFn = (request: Request, context?: never) => Promise<Response>;

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const BASE = "http://localhost:3000";

/** Minimal cookie jar that mirrors what a browser would keep from Set-Cookie headers. */
export class CookieJar {
  private readonly cookies = new Map<string, string>();

  absorb(response: Response): void {
    for (const header of response.headers.getSetCookie()) {
      const [pair = "", ...attributes] = header.split(";");
      const index = pair.indexOf("=");
      const name = pair.slice(0, index).trim();
      const value = pair.slice(index + 1).trim();
      const expired = attributes.some((attr) => attr.trim() === "Max-Age=0");
      if (expired || value === "") this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }

  get(name: string): string | undefined {
    return this.cookies.get(name);
  }

  header(): string {
    return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
  }
}

export type SendOptions = {
  method?: string;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string>;
};

/** Simulates one browser: keeps cookies, fetches CSRF tokens, and sends a unique client IP. */
export class ApiClient {
  readonly jar = new CookieJar();
  private csrfToken: string | undefined;

  constructor(
    private readonly csrfRoute: RouteFn,
    readonly clientIp: string = `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
  ) {}

  async send(handler: RouteFn, options: SendOptions): Promise<Response> {
    const method = options.method ?? "GET";
    if (UNSAFE.has(method)) await this.ensureCsrf();

    const headers = new Headers(options.headers);
    headers.set("x-forwarded-for", this.clientIp);
    const cookie = this.jar.header();
    if (cookie) headers.set("cookie", cookie);
    if (options.body !== undefined) headers.set("content-type", "application/json");
    if (UNSAFE.has(method) && this.csrfToken) headers.set("x-csrf-token", this.csrfToken);

    const request = new Request(new URL(options.path, BASE), {
      method,
      headers,
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });
    const context = options.params ? { params: Promise.resolve(options.params) } : undefined;
    const response = await handler(request, context as never);
    this.jar.absorb(response);
    return response;
  }

  async ensureCsrf(): Promise<void> {
    if (this.csrfToken && this.jar.get("vellum_csrf")) return;
    const headers = new Headers({ "x-forwarded-for": this.clientIp });
    const cookie = this.jar.header();
    if (cookie) headers.set("cookie", cookie);
    const response = await this.csrfRoute(
      new Request(new URL("/api/v1/security/csrf", BASE), { headers }),
    );
    this.jar.absorb(response);
    const body = (await response.json()) as { csrfToken: string };
    this.csrfToken = body.csrfToken;
  }
}

export async function json<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export function db(): PrismaClient {
  return getDb();
}
