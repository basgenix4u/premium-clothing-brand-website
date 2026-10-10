import { getEnv } from "@/server/config/env";

/**
 * Key used for rate limiting. X-Forwarded-For is only honoured when TRUST_PROXY=true,
 * because otherwise clients could spoof it to bypass limits.
 */
export function clientIpKey(request: Request): string {
  if (getEnv().TRUST_PROXY !== "true") return "direct";
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first && first.length > 0 ? first.slice(0, 64) : "unknown";
}
