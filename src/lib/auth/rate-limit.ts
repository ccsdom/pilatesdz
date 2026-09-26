/**
 * In-memory sliding window Rate Limiter for HTTP API endpoints.
 * Protects against brute-force, script bots, and request flooding.
 */

interface RateLimitRecord {
  timestamps: number[];
}

export interface RateLimitOptions {
  windowMs: number; // Window size in milliseconds
  max: number;      // Max allowed requests within windowMs
}

class MemoryRateLimiter {
  private hits = new Map<string, RateLimitRecord>();

  /**
   * Evaluates if a request key (e.g. IP + endpoint) exceeds the allowed limit.
   */
  check(key: string, options: RateLimitOptions, now = Date.now()): {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetMs: number;
  } {
    const windowStart = now - options.windowMs;
    const record = this.hits.get(key) || { timestamps: [] };

    // Filter out timestamps outside the sliding window
    const validTimestamps = record.timestamps.filter((ts) => ts > windowStart);
    const count = validTimestamps.length;

    if (count >= options.max) {
      const oldestInWindow = validTimestamps[0] ?? now;
      const resetMs = oldestInWindow + options.windowMs - now;
      this.hits.set(key, { timestamps: validTimestamps });
      return {
        allowed: false,
        limit: options.max,
        remaining: 0,
        resetMs: Math.max(0, resetMs),
      };
    }

    validTimestamps.push(now);
    this.hits.set(key, { timestamps: validTimestamps });

    return {
      allowed: true,
      limit: options.max,
      remaining: options.max - validTimestamps.length,
      resetMs: options.windowMs,
    };
  }

  /**
   * Resets hit tracking for a key (useful for tests or IP unblock).
   */
  reset(key?: string): void {
    if (key) {
      this.hits.delete(key);
    } else {
      this.hits.clear();
    }
  }
}

export const rateLimiter = new MemoryRateLimiter();

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
