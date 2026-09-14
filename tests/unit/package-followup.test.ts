import { expect, it, vi } from "vitest";
import { summarizePackages, type FollowupPackage } from "../../src/domain/models/package-followup";
import { createPackageFollowupService } from "../../src/services/package-followup";
const at = 1800000000000, day = 86400000;
const pack: FollowupPackage = { id: "p", clientId: "c", centerId: "alger", label: "Manuel", credits: 4, remaining: 1, validFrom: at - day, expiresAt: at + 3 * day, assignedAt: at - day };
it("sums current credits across packages and keeps future credits separate", () => {
  expect(summarizePackages([pack], {}, at)).toMatchObject({ low: true, remaining: 1, future: 0 });
  expect(summarizePackages([pack, { ...pack, id: "other", remaining: 3 }], {}, at).low).toBe(false);
  expect(summarizePackages([pack, { ...pack, id: "future", validFrom: at + day, remaining: 4 }], {}, at)).toMatchObject({ low: true, remaining: 1, future: 4 });
});
it("does not treat a quarterly monthly boundary as the subscription end", () => {
  const quarterly = { ...pack, subscriptionId: "sub" };
  expect(summarizePackages([quarterly], { sub: at + 60 * day }, at).endings).toEqual([]);
  expect(summarizePackages([quarterly, { ...quarterly, id: "duplicate" }], { sub: at + 7 * day }, at).endings).toHaveLength(1);
  expect(() => summarizePackages([quarterly], {}, at)).toThrow();
});
it("handles expiry boundaries and does not flag customers without a current package", () => {
  expect(summarizePackages([{ ...pack, expiresAt: at }], {}, at)).toMatchObject({ low: false, remaining: 0, endings: [] });
  expect(summarizePackages([], {}, at).low).toBe(false);
  expect(summarizePackages([{ ...pack, remaining: 0 }], {}, at).low).toBe(true);
  expect(summarizePackages([{ ...pack, expiresAt: at + 7 * day + 1 }], {}, at).endings).toEqual([]);
});
it("rejects customer access and malformed cursors before data access", () => {
  const repository = { list: vi.fn() }, service = createPackageFollowupService(repository);
  expect(() => service.list({ uid: "a", centerId: "alger", role: "client" })).toThrow();
  expect(() => service.list({ uid: "a", centerId: "alger", role: "admin" }, "../other")).toThrow();
  expect(repository.list).not.toHaveBeenCalled();
});
