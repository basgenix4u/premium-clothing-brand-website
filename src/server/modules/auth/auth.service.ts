import { ConflictError, RateLimitedError, UnauthorizedError } from "@/server/http/errors";
import type { FixedWindowRateLimiter } from "@/server/http/rate-limit";
import { randomToken, sha256Hex } from "@/server/security/hash";
import type { AuthRepository, UserRecord } from "@/server/modules/auth/auth.repository";
import { hashPassword, verifyDecoy, verifyPassword } from "@/server/modules/auth/password";
import type { LoginInput, RegisterInput } from "@/server/modules/auth/schemas";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type PublicUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: "CUSTOMER" | "ADMIN";
};

export type RequestMeta = { ipKey: string; userAgent?: string };

export type IssuedSession = { token: string; expiresAt: Date; user: PublicUser };

export type AuthServiceDeps = {
  repository: AuthRepository;
  loginLimiter: FixedWindowRateLimiter;
  registerLimiter: FixedWindowRateLimiter;
  now?: () => Date;
};

const toPublic = (user: UserRecord): PublicUser => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
});

export class AuthService {
  private readonly now: () => Date;

  constructor(private readonly deps: AuthServiceDeps) {
    this.now = deps.now ?? (() => new Date());
  }

  async register(input: RegisterInput, meta: RequestMeta): Promise<PublicUser> {
    this.assertAllowed(this.deps.registerLimiter, meta.ipKey);
    if (await this.deps.repository.findUserByEmail(input.email)) {
      // Generic wording. The 409 status still reveals the email exists; see ARCHITECTURE §10.5.
      throw new ConflictError(
        "We could not create an account with those details. Try signing in instead.",
      );
    }
    const passwordHash = await hashPassword(input.password);
    const user = await this.deps.repository.createUser({
      email: input.email,
      passwordHash,
      ...(input.fullName ? { fullName: input.fullName } : {}),
    });
    return toPublic(user);
  }

  async login(input: LoginInput, meta: RequestMeta): Promise<IssuedSession> {
    const limiterKey = `${meta.ipKey}|${input.email}`;
    this.assertAllowed(this.deps.loginLimiter, limiterKey);

    const user = await this.deps.repository.findUserByEmail(input.email);
    const valid = user
      ? await verifyPassword(user.passwordHash, input.password)
      : await verifyDecoy(input.password);
    if (!user || !valid) {
      throw new UnauthorizedError("Email or password is incorrect.");
    }
    this.deps.loginLimiter.reset(limiterKey);
    return this.createSession(user, meta);
  }

  async createSession(user: UserRecord, meta: RequestMeta): Promise<IssuedSession> {
    const token = randomToken(32);
    const expiresAt = new Date(this.now().getTime() + SESSION_TTL_MS);
    await this.deps.repository.createSession({
      userId: user.id,
      tokenHash: sha256Hex(token),
      expiresAt,
      ...(meta.userAgent ? { userAgent: meta.userAgent } : {}),
      ipHash: sha256Hex(meta.ipKey),
    });
    return { token, expiresAt, user: toPublic(user) };
  }

  async logout(token: string | undefined): Promise<void> {
    if (!token) return;
    await this.deps.repository.revokeSession(sha256Hex(token), this.now());
  }

  async currentUser(token: string | undefined): Promise<PublicUser | null> {
    if (!token) return null;
    const session = await this.deps.repository.findActiveSession(sha256Hex(token), this.now());
    return session ? toPublic(session.user) : null;
  }

  private assertAllowed(limiter: FixedWindowRateLimiter, key: string): void {
    const result = limiter.consume(key);
    if (!result.allowed) throw new RateLimitedError(result.retryAfterSeconds);
  }
}
