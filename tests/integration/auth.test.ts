import { describe, expect, it } from "vitest";
import * as csrfRoute from "@/app/api/v1/security/csrf/route";
import * as registerRoute from "@/app/api/v1/auth/register/route";
import * as loginRoute from "@/app/api/v1/auth/login/route";
import * as logoutRoute from "@/app/api/v1/auth/logout/route";
import * as meRoute from "@/app/api/v1/auth/me/route";
import { ApiClient, db, json } from "./helpers";

const PASSWORD = "a-long-passphrase-123";

describe("authentication flow", () => {
  it("forbids a request whose CSRF header does not match the cookie", async () => {
    const client = new ApiClient(csrfRoute.GET);
    await client.ensureCsrf();
    const request = new Request("http://localhost:3000/api/v1/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: client.jar.header(),
        "x-csrf-token": "forged-token-value",
        "x-forwarded-for": client.clientIp,
      },
      body: JSON.stringify({ email: "forged@example.com", password: PASSWORD }),
    });
    const response = await registerRoute.POST(request);
    expect(response.status).toBe(403);
    expect(await db().user.count({ where: { email: "forged@example.com" } })).toBe(0);
  });

  it("registers, logs in, reads the profile and logs out", async () => {
    const client = new ApiClient(csrfRoute.GET);
    const email = "ada.lovelace@example.com";

    const registered = await client.send(registerRoute.POST, {
      method: "POST",
      path: "/api/v1/auth/register",
      body: { email, password: PASSWORD, fullName: "Ada Lovelace" },
    });
    expect(registered.status).toBe(201);
    const stored = await db().user.findUniqueOrThrow({ where: { email } });
    expect(stored.passwordHash.startsWith("$argon2id$")).toBe(true);
    expect(stored.passwordHash).not.toContain(PASSWORD);

    const login = await client.send(loginRoute.POST, {
      method: "POST",
      path: "/api/v1/auth/login",
      body: { email, password: PASSWORD },
    });
    expect(login.status).toBe(200);
    const setCookie = login.headers.getSetCookie().find((c) => c.startsWith("vellum_session="));
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");

    const me = await client.send(meRoute.GET, { path: "/api/v1/auth/me" });
    expect(me.status).toBe(200);
    expect(await json<{ user: { email: string } }>(me)).toMatchObject({ user: { email } });

    const logout = await client.send(logoutRoute.POST, {
      method: "POST",
      path: "/api/v1/auth/logout",
    });
    expect(logout.status).toBe(200);
    const after = await client.send(meRoute.GET, { path: "/api/v1/auth/me" });
    expect(after.status).toBe(401);
  });

  it("returns a generic error for wrong passwords and unknown emails alike", async () => {
    const client = new ApiClient(csrfRoute.GET);
    await client.send(registerRoute.POST, {
      method: "POST",
      path: "/api/v1/auth/register",
      body: { email: "enumeration@example.com", password: PASSWORD },
    });
    const wrongPassword = await client.send(loginRoute.POST, {
      method: "POST",
      path: "/api/v1/auth/login",
      body: { email: "enumeration@example.com", password: "not-the-password-1" },
    });
    const unknownEmail = await client.send(loginRoute.POST, {
      method: "POST",
      path: "/api/v1/auth/login",
      body: { email: "nobody-here@example.com", password: "not-the-password-1" },
    });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    const strip = (body: Record<string, unknown>) => ({
      title: body.title,
      status: body.status,
      detail: body.detail,
    });
    expect(strip(await json(wrongPassword))).toEqual(strip(await json(unknownEmail)));
  });

  it("returns a generic 409 when the email already exists", async () => {
    const client = new ApiClient(csrfRoute.GET);
    const body = { email: "duplicate@example.com", password: PASSWORD };
    const first = await client.send(registerRoute.POST, {
      method: "POST",
      path: "/api/v1/auth/register",
      body,
    });
    const second = await client.send(registerRoute.POST, {
      method: "POST",
      path: "/api/v1/auth/register",
      body,
    });
    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
  });

  it("validates password length and rejects mass-assignment of roles", async () => {
    const client = new ApiClient(csrfRoute.GET);
    const short = await client.send(registerRoute.POST, {
      method: "POST",
      path: "/api/v1/auth/register",
      body: { email: "short@example.com", password: "tiny" },
    });
    expect(short.status).toBe(422);
    const shortProblem = await json<{ errors?: Record<string, unknown[]> }>(short);
    expect(shortProblem.errors?.password).toBeDefined();

    const escalation = await client.send(registerRoute.POST, {
      method: "POST",
      path: "/api/v1/auth/register",
      body: { email: "escalate@example.com", password: PASSWORD, role: "ADMIN" },
    });
    expect(escalation.status).toBe(422);
    expect(await db().user.findUnique({ where: { email: "escalate@example.com" } })).toBeNull();
  });

  it("rejects an expired or unknown session token on /auth/me", async () => {
    const client = new ApiClient(csrfRoute.GET);
    client.jar.absorb(
      new Response(null, { headers: { "Set-Cookie": "vellum_session=made-up-token; Path=/" } }),
    );
    const response = await client.send(meRoute.GET, { path: "/api/v1/auth/me" });
    expect(response.status).toBe(401);
  });
});
