import { describe, expect, it } from "vitest";
import { extractIdempotencyKey } from "@/lib/auth/idempotency";

describe("extractIdempotencyKey", () => {
  const validUuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
  const validUuid2 = "a1b2c3d4-e5f6-4789-8012-3456789abcde";

  it("extracts valid UUID from Idempotency-Key header", () => {
    const headers = new Headers({ "Idempotency-Key": validUuid });
    expect(extractIdempotencyKey(headers)).toBe(validUuid);
  });

  it("extracts valid UUID from X-Idempotency-Key header", () => {
    const headers = new Headers({ "X-Idempotency-Key": validUuid });
    expect(extractIdempotencyKey(headers)).toBe(validUuid);
  });

  it("falls back to body requestId when header is missing", () => {
    const headers = new Headers();
    const body = { requestId: validUuid2, amount: 5000 };
    expect(extractIdempotencyKey(headers, body)).toBe(validUuid2);
  });

  it("prioritizes valid header over body requestId", () => {
    const headers = new Headers({ "Idempotency-Key": validUuid });
    const body = { requestId: validUuid2 };
    expect(extractIdempotencyKey(headers, body)).toBe(validUuid);
  });

  it("ignores invalid UUID in header and falls back to valid body requestId", () => {
    const headers = new Headers({ "Idempotency-Key": "invalid-uuid" });
    const body = { requestId: validUuid2 };
    expect(extractIdempotencyKey(headers, body)).toBe(validUuid2);
  });

  it("returns null when neither header nor body contain a valid UUID", () => {
    const headers = new Headers();
    const body = { requestId: "not-a-uuid" };
    expect(extractIdempotencyKey(headers, body)).toBeNull();
  });
});
