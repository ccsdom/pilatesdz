import { describe, expect, it, beforeEach } from "vitest";
import { rateLimiter, getClientIp } from "@/lib/auth/rate-limit";

describe("rateLimiter", () => {
  beforeEach(() => {
    rateLimiter.reset();
  });

  it("allows requests under max limit", () => {
    const key = "test_ip_1";
    const opts = { windowMs: 60000, max: 3 };

    expect(rateLimiter.check(key, opts).allowed).toBe(true);
    expect(rateLimiter.check(key, opts).allowed).toBe(true);
    expect(rateLimiter.check(key, opts).allowed).toBe(true);
  });

  it("blocks requests exceeding max limit", () => {
    const key = "test_ip_2";
    const opts = { windowMs: 60000, max: 2 };

    rateLimiter.check(key, opts);
    rateLimiter.check(key, opts);

    const res = rateLimiter.check(key, opts);
    expect(res.allowed).toBe(false);
    expect(res.remaining).toBe(0);
    expect(res.resetMs).toBeGreaterThan(0);
  });

  it("resolves client IP correctly from headers", () => {
    const headersForwarded = new Headers({ "x-forwarded-for": "198.51.100.42, 10.0.0.1" });
    expect(getClientIp(headersForwarded)).toBe("198.51.100.42");

    const headersRealIp = new Headers({ "x-real-ip": "203.0.113.19" });
    expect(getClientIp(headersRealIp)).toBe("203.0.113.19");

    const headersEmpty = new Headers();
    expect(getClientIp(headersEmpty)).toBe("127.0.0.1");
  });
});
