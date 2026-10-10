import argon2 from "argon2";

/** OWASP-aligned argon2id parameters (memory in KiB). */
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON2_OPTIONS);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

let decoyHash: Promise<string> | undefined;

/**
 * When the account does not exist we still run a full verification, so response
 * time does not reveal which emails are registered.
 */
export function verifyDecoy(plain: string): Promise<boolean> {
  decoyHash ??= hashPassword("decoy-password-never-used");
  return decoyHash.then((hash) => verifyPassword(hash, plain)).then(() => false);
}
