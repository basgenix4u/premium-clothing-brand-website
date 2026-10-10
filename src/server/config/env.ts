import { z } from "zod";

const LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace", "silent"] as const;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.url().default("http://localhost:3000"),
  APP_VERSION: z.string().min(1).default("0.1.0"),
  LOG_LEVEL: z.enum(LOG_LEVELS).default("info"),
  DATABASE_URL: z.string().min(1).optional(),
  /** Only set to "true" behind a reverse proxy that overwrites X-Forwarded-For. */
  TRUST_PROXY: z.enum(["true", "false"]).default("false"),
});

export type AppEnv = z.infer<typeof envSchema>;

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/**
 * Validates raw environment variables. Error messages name the offending keys
 * but never echo their values, so secrets cannot leak through logs.
 */
export function parseEnv(source: Readonly<Record<string, string | undefined>>): AppEnv {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new ConfigError(`Invalid environment configuration: ${issues}`);
  }
  return result.data;
}

let cached: AppEnv | undefined;

export function getEnv(): AppEnv {
  cached ??= parseEnv(process.env);
  return cached;
}

/** Cookies are marked Secure whenever the public origin uses HTTPS. */
export function isSecureOrigin(env: AppEnv = getEnv()): boolean {
  return env.APP_URL.startsWith("https://");
}
