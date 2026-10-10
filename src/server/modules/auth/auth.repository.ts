import type { Db } from "@/server/db/client";

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string | null;
  role: "CUSTOMER" | "ADMIN";
};

export type SessionWithUser = {
  id: string;
  user: UserRecord;
};

export class AuthRepository {
  constructor(private readonly db: Db) {}

  findUserByEmail(email: string): Promise<UserRecord | null> {
    return this.db.user.findUnique({ where: { email } });
  }

  findUserById(id: string) {
    return this.db.user.findUnique({ where: { id } });
  }

  createUser(data: {
    email: string;
    passwordHash: string;
    fullName?: string;
  }): Promise<UserRecord> {
    return this.db.user.create({
      data: { email: data.email, passwordHash: data.passwordHash, fullName: data.fullName ?? null },
    });
  }

  createSession(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipHash?: string;
  }): Promise<unknown> {
    return this.db.session.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        userAgent: data.userAgent?.slice(0, 255) ?? null,
        ipHash: data.ipHash ?? null,
      },
    });
  }

  findActiveSession(tokenHash: string, now: Date): Promise<SessionWithUser | null> {
    return this.db.session.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: now } },
      select: { id: true, user: true },
    });
  }

  async revokeSession(tokenHash: string, now: Date): Promise<void> {
    await this.db.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: now },
    });
  }
}
