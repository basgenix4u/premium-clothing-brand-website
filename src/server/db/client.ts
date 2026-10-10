import { PrismaPg } from "@prisma/adapter-pg";
import { ConfigError } from "@/server/config/env";
import { PrismaClient } from "@/server/db/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { __vellumPrisma?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new ConfigError("Invalid environment configuration: DATABASE_URL: is required");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

/** Lazily created singleton. Survives hot reloads in development. */
export function getDb(): PrismaClient {
  globalForPrisma.__vellumPrisma ??= createClient();
  return globalForPrisma.__vellumPrisma;
}

export type Db = PrismaClient;
