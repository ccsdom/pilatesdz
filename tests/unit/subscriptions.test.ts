import { expect, it, vi } from "vitest";
import { planSubscription } from "../../src/domain/models/subscription";
import { studioDay } from "../../src/domain/models/planning";
import { canUsePackage, type CreditPackage } from "../../src/domain/models/package";
import { createSubscriptionService } from "../../src/services/subscriptions";
const input = { offerId: "monthly-4" as const, term: "quarterly" as const, purchaseDate: "2027-01-31" };
it.each([["monthly-4", "monthly", 12000, 1, 4], ["monthly-8", "monthly", 20000, 1, 8], ["monthly-4", "quarterly", 28800, 3, 4], ["monthly-8", "quarterly", 48000, 3, 8]] as const)("prices %s %s and creates distinct monthly credits", (offerId, term, amount, count, credits) => {
  const plan = planSubscription({ ...input, offerId, term });
  expect(plan.amountDzd).toBe(amount); expect(plan.periods).toHaveLength(count);
  expect(plan.periods.every(period => period.credits === credits)).toBe(true);
});
it.each([
  ["2027-01-31", ["2027-01-31", "2027-02-28", "2027-03-31", "2027-04-30"]],
  ["2028-01-31", ["2028-01-31", "2028-02-29", "2028-03-31", "2028-04-30"]],
  ["2026-12-15", ["2026-12-15", "2027-01-15", "2027-02-15", "2027-03-15"]],
])("preserves purchase anniversary across short months: %s", (purchaseDate, expected) => {
  const plan = planSubscription({ ...input, purchaseDate });
  expect([...plan.periods.map(period => studioDay(period.validFrom)), studioDay(plan.periods.at(-1)!.expiresAt)]).toEqual(expected);
  for (let i = 1; i < plan.periods.length; i++) expect(plan.periods[i].validFrom).toBe(plan.periods[i - 1].expiresAt);
});
it("does not carry unused credits into the next period or borrow future credits", () => {
  const periods = planSubscription(input).periods;
  const packs = periods.map((period, index) => ({ ...period, id: String(index), centerId: "alger", clientId: "c", remaining: period.credits, assignedAt: 1 } satisfies CreditPackage));
  expect(canUsePackage(packs[0], packs[1].validFrom)).toBe(false);
  expect(canUsePackage(packs[1], packs[1].validFrom - 1)).toBe(false);
  expect(canUsePackage(packs[1], packs[1].validFrom)).toBe(true);
});
it.each(["2027-02-30", "2027-13-01", "bad", "2027-01-01T12:00"])("rejects invalid purchase dates %s", purchaseDate => {
  expect(() => planSubscription({ ...input, purchaseDate })).toThrow();
});
it("rejects clients, forged prices and traversal before persistence", () => {
  const repository = { assign: vi.fn() }; const service = createSubscriptionService(repository);
  const actor = { uid: "admin", centerId: "alger", role: "admin" as const };
  const id = "e15f3c91-434a-4e9c-8056-31a530742a52";
  expect(() => service.assign({ ...actor, role: "client" }, "c", id, input)).toThrow();
  expect(() => service.assign(actor, "../other", id, input)).toThrow();
  expect(() => service.assign(actor, "c", id, { ...input, amountDzd: 1 })).toThrow();
  expect(repository.assign).not.toHaveBeenCalled();
});
