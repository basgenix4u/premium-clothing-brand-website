export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSeconds: number };

/**
 * Fixed-window limiter held in process memory. Adequate for a single instance;
 * replace the store with Redis before running multiple replicas.
 */
export class FixedWindowRateLimiter {
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  consume(key: string): RateLimitResult {
    const current = this.now();
    this.evictExpired(current);
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= current) {
      this.buckets.set(key, { count: 1, resetAt: current + this.windowMs });
      return { allowed: true, remaining: this.limit - 1, retryAfterSeconds: 0 };
    }
    bucket.count += 1;
    const retryAfterSeconds = Math.ceil((bucket.resetAt - current) / 1000);
    if (bucket.count > this.limit) {
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }
    return { allowed: true, remaining: this.limit - bucket.count, retryAfterSeconds: 0 };
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }

  private evictExpired(current: number): void {
    if (this.buckets.size < 10_000) return;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= current) this.buckets.delete(key);
    }
  }
}
