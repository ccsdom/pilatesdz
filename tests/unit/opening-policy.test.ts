import { expect, it } from "vitest";
import { emptyOpeningPolicy, openingForDay, openingPolicySchema, encodeOpeningPolicy, decodeOpeningPolicy } from "../../src/domain/models/opening-policy";
import { defaultStudioOpening } from "../../src/domain/models/studio-opening";
it("résout la date d’effet sans changer les horaires précédents", () => {
  const closed = { ...defaultStudioOpening(), week: Array.from({ length: 7 }, () => []) };
  const policy = { version: 2, revisions: [
    { version: 1, effectiveFrom: "2026-10-01", updatedAt: 1, updatedBy: "manager", opening: closed },
    { version: 2, effectiveFrom: "2026-11-01", updatedAt: 2, updatedBy: "manager", opening: defaultStudioOpening() },
  ] };
  expect(openingForDay(emptyOpeningPolicy(), "2026-09-30")).toEqual(defaultStudioOpening());
  expect(openingForDay(policy, "2026-09-30")).toEqual(defaultStudioOpening());
  expect(openingForDay(policy, "2026-10-01")).toEqual(closed);
  expect(openingForDay(policy, "2026-10-31")).toEqual(closed);
  expect(openingForDay(policy, "2026-11-01")).toEqual(defaultStudioOpening());
  expect(openingPolicySchema.safeParse(policy).success).toBe(true);
  expect(decodeOpeningPolicy(encodeOpeningPolicy(policy))).toEqual(policy);
  expect(Array.isArray(encodeOpeningPolicy(policy).revisions[0].opening.week)).toBe(false);
  expect(openingPolicySchema.safeParse({ ...policy, revisions: [...policy.revisions].reverse() }).success).toBe(false);
  expect(openingPolicySchema.safeParse({ ...policy, version: 3 }).success).toBe(false);
});
it("retient la dernière correction pour une même date", () => {
  const revisions = [
    { effectiveFrom: "2026-10-01", opening: defaultStudioOpening() },
    { effectiveFrom: "2026-10-01", opening: { ...defaultStudioOpening(), week: Array.from({ length: 7 }, () => []) } },
  ];
  expect(openingForDay({ revisions }, "2026-10-01").week.every(day => day.length === 0)).toBe(true);
});
