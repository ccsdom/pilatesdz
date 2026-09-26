import { describe, expect, it } from "vitest";
import { auditLogSchema } from "@/repositories/firestore/audit-log";

describe("auditLogSchema", () => {
  const validUuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

  it("validates a properly formatted AuditLog entry", () => {
    const entry = {
      id: validUuid,
      centerId: "alger",
      actorUid: "manager_123",
      action: "PAYMENT_RECORDED",
      targetType: "Payment",
      targetId: "pay_999",
      timestamp: 1770000000000,
      details: { amountDzd: 15000, method: "cash" },
    };

    const parsed = auditLogSchema.parse(entry);
    expect(parsed.actorUid).toBe("manager_123");
    expect(parsed.action).toBe("PAYMENT_RECORDED");
  });

  it("fails validation if required fields are missing", () => {
    const invalid = {
      id: validUuid,
      centerId: "alger",
      // missing actorUid
      action: "PAYMENT_RECORDED",
    };

    expect(() => auditLogSchema.parse(invalid)).toThrow();
  });
});
