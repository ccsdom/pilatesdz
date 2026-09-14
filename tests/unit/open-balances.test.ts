import { expect, it, vi } from "vitest";
import { subscriptionBalance } from "../../src/domain/models/open-balances";
import { createOpenBalanceService } from "../../src/services/open-balances";
it("distinguishes absent payments, deposits, corrected history and a settled balance", () => {
  expect(subscriptionBalance(12000, undefined, undefined)).toMatchObject({ remainingMinor: 1200000, state: "none" });
  expect(subscriptionBalance(12000, 300000, true)).toMatchObject({ paidMinor: 300000, remainingMinor: 900000, state: "partial" });
  expect(subscriptionBalance(12000, 0, true).state).toBe("history");
  expect(subscriptionBalance(12000, 1200000, true)).toMatchObject({ remainingMinor: 0, state: "settled" });
});
it.each([[0, 0, false], [1.2, 0, false], [12000, -1, true], [12000, 1200001, true], [12000, null, false], [12000, 1, false], [12000, 0, "true"], [Number.MAX_SAFE_INTEGER, 0, false]])("rejects inconsistent or unsafe balances %j", (amount, paid, recorded) => {
  expect(() => subscriptionBalance(amount, paid, recorded)).toThrow();
});
it("rejects unauthorized actors and invalid cursors before data access", () => {
  const repository = { list: vi.fn() }, service = createOpenBalanceService(repository);
  expect(() => service.list({ uid: "a", centerId: "alger", role: "client" })).toThrow();
  expect(() => service.list({ uid: "a", centerId: "alger", role: "admin" }, "../other")).toThrow();
  expect(repository.list).not.toHaveBeenCalled();
});
