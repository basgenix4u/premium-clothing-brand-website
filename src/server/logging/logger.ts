import pino, { type Logger } from "pino";
import { getEnv } from "@/server/config/env";

const REDACTED_PATHS = [
  "password",
  "*.password",
  "token",
  "*.token",
  "secret",
  "*.secret",
  "authorization",
  "*.authorization",
  "cookie",
  "*.cookie",
  "headers.authorization",
  "headers.cookie",
];

export function createLogger(level: string, destination?: pino.DestinationStream): Logger {
  const options: pino.LoggerOptions = {
    level,
    base: { service: "vellum-storefront" },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: { paths: REDACTED_PATHS, censor: "[REDACTED]" },
  };
  return destination ? pino(options, destination) : pino(options);
}

let logger: Logger | undefined;

export function getLogger(): Logger {
  logger ??= createLogger(getEnv().LOG_LEVEL);
  return logger;
}
