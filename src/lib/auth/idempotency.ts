import { z } from "zod";

const uuidSchema = z.string().uuid();

/**
 * Extracts and validates an Idempotency Key from HTTP request headers or body payload.
 * Checks 'Idempotency-Key' and 'X-Idempotency-Key' headers first, falling back to body `requestId`.
 */
export function extractIdempotencyKey(
  headers: Headers,
  body?: Record<string, unknown> | null
): string | null {
  const headerKey =
    headers.get("idempotency-key") ||
    headers.get("Idempotency-Key") ||
    headers.get("x-idempotency-key") ||
    headers.get("X-Idempotency-Key");

  if (headerKey && headerKey.trim()) {
    const trimmed = headerKey.trim();
    if (uuidSchema.safeParse(trimmed).success) {
      return trimmed;
    }
  }

  if (body && typeof body === "object") {
    const bodyKey = body.requestId;
    if (typeof bodyKey === "string" && uuidSchema.safeParse(bodyKey).success) {
      return bodyKey;
    }
  }

  return null;
}
