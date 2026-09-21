import { expect, it } from "vitest";
import { creditStatus, creditTransition, settlementInput } from "../../src/domain/models/credit-settlement";
it("moves a reservation into consumption without a second debit", () => {
  expect(creditTransition({ credits: 10, remaining: 8, reserved: 2 }, "reserved", "consumed")).toEqual({ remaining: 8, reserved: 1, consumed: 1 });
});
it("releases held credits and supports accountable corrections", () => {
  expect(creditTransition({ credits: 10, remaining: 8, reserved: 2 }, "reserved", "refunded")).toEqual({ remaining: 9, reserved: 1, consumed: 0 });
  expect(creditTransition({ credits: 10, remaining: 8, reserved: 1 }, "consumed", "refunded")).toEqual({ remaining: 9, reserved: 1, consumed: 0 });
  expect(creditTransition({ credits: 10, remaining: 9, reserved: 1 }, "refunded", "consumed")).toEqual({ remaining: 8, reserved: 1, consumed: 1 });
});
it("preserves historical debits and does not invent credits for cash bookings", () => {
  expect(creditStatus({})).toBeNull();
  expect(creditStatus({ creditPackageId: "old-pack" })).toEqual({ state: "consumed", version: 0, legacy: true });
  expect(creditTransition({ credits: 10, remaining: 9 }, "consumed", "consumed")).toEqual({ remaining: 9, reserved: 0, consumed: 1 });
  expect(creditStatus({ creditPackageId: "old-pack", creditRefunded: true })?.state).toBe("refunded");
});
it("rejects invalid balances and missing correction reasons", () => {
  expect(() => creditTransition({ credits: 1, remaining: 0, reserved: 0 }, "refunded", "consumed")).toThrow();
  expect(() => creditTransition({ credits: 1, remaining: 1, reserved: 0 }, "reserved", "consumed")).toThrow();
  expect(() => creditStatus({ creditPackageId: "../other" })).toThrow();
  expect(settlementInput.safeParse({ id: "session", clientId: "client", requestId: "bad", version: 0, state: "consumed", reason: "" }).success).toBe(false);
});
