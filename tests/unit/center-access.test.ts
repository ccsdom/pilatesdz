import { expect, it } from "vitest";
import { belongsToCenter } from "@/domain/policies/center-access";

const membership = { uid: "alice", centerId: "alger", active: true };
it("accepts the active membership of the verified user in the requested center", () => {
  expect(belongsToCenter("alice", "alger", membership)).toBe(true);
});
it("rejects anonymous users, another identity, another center and revoked membership", () => {
  expect(belongsToCenter(null, "alger", membership)).toBe(false);
  expect(belongsToCenter("bob", "alger", membership)).toBe(false);
  expect(belongsToCenter("alice", "oran", membership)).toBe(false);
  expect(belongsToCenter("alice", "alger", { ...membership, active: false })).toBe(false);
  expect(belongsToCenter("alice", "alger", null)).toBe(false);
});
