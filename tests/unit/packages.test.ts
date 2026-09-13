import { expect, it, vi } from "vitest";
import { packageInputSchema, packageDates, selectPackage, canUsePackage, type CreditPackage } from "../../src/domain/models/package";
import { createPackageService } from "../../src/services/packages";
const dates = packageDates("2030-01-01", "2030-01-31");
const pack: CreditPackage = { id: "a", centerId: "alger", clientId: "c", label: "10 séances", credits: 10, remaining: 10, assignedAt: 1, ...dates };
it("includes the last Alger day and excludes the next midnight", () => {
  expect(new Date(dates.expiresAt).toISOString()).toBe("2030-01-31T23:00:00.000Z");
  expect(canUsePackage(pack, dates.validFrom)).toBe(true);
  expect(canUsePackage(pack, dates.expiresAt - 1)).toBe(true);
  expect(canUsePackage(pack, dates.expiresAt)).toBe(false);
  expect(canUsePackage(pack, dates.validFrom - 1)).toBe(false);
});
it.each([{ credits: 0 }, { credits: 101 }, { credits: 1.5 }, { label: " " }, { expiresAt: dates.validFrom }, { expiresAt: dates.validFrom + 367 * 86400000 }, { injected: true }])("rejects invalid package terms %j", (change) => {
  expect(packageInputSchema.safeParse({ label: "Forfait", credits: 10, ...dates, ...change }).success).toBe(false);
});
it("selects earliest expiry among usable packages without changing the input", () => {
  const packs = [{ ...pack, id: "later", expiresAt: pack.expiresAt + 1 }, { ...pack, id: "empty", remaining: 0, expiresAt: pack.expiresAt - 1 }, pack];
  expect(selectPackage(packs, dates.validFrom)?.id).toBe("a");
  expect(packs[0].id).toBe("later");
  expect(selectPackage(packs, pack.expiresAt + 2)).toBeUndefined();
});
it("rejects customer attribution and another customer lookup before persistence", () => {
  const repo = { assign: vi.fn(), list: vi.fn() };
  const service = createPackageService(repo);
  const actor = { uid: "c", centerId: "alger", role: "client" as const };
  expect(() => service.assign(actor, "c", "id", pack)).toThrow();
  expect(() => service.list(actor, "other")).toThrow();
  expect(repo.assign).not.toHaveBeenCalled(); expect(repo.list).not.toHaveBeenCalled();
});
it("rejects invalid identifiers and pagination cursors", () => {
  const repo = { assign: vi.fn(), list: vi.fn() };
  const service = createPackageService(repo);
  const actor = { uid: "a", centerId: "alger", role: "admin" as const };
  expect(() => service.assign(actor, "../other", "id", { label: "Forfait", credits: 10, ...dates })).toThrow();
  expect(() => service.list(actor, "c", "invalid/cursor")).toThrow();
  expect(repo.assign).not.toHaveBeenCalled(); expect(repo.list).not.toHaveBeenCalled();
});
