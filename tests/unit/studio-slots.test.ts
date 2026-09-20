import { expect, it } from "vitest";
import { studioSlots, slotAvailability, type SlotOccupancy } from "../../src/domain/models/studio-slots";
const slots = studioSlots("2026-10-12", "femme");
const slot = slots[0];
const occupied = (count: number): SlotOccupancy => ({ id: slot.id, startsAt: slot.startsAt, durationMinutes: 60, capacity: 4, bookedCount: count, status: "scheduled" });
it("opens one shared capacity of four per hour with no weekly limit", () => {
  expect(slots).toHaveLength(4);
  expect(studioSlots("2026-10-12", "homme")).toHaveLength(6);
  expect(studioSlots("2027-01-05", "femme")).toHaveLength(8);
  expect(studioSlots("2026-10-09", "femme")).toEqual([]);
  expect(slot.id).toBe("pub_2026-10-12_1000_femme");
  expect(slot.endsAt - slot.startsAt).toBe(3600000);
  expect(slot.totalCapacity).toBe(4);
});
it("uses actual counts and restores availability after cancellation", () => {
  expect(slotAvailability(slot, [occupied(3)], 0).available).toBe(1);
  expect(slotAvailability(slot, [occupied(4)], 0).status).toBe("full");
  expect(slotAvailability(slot, [occupied(2)], 0).available).toBe(2);
  expect(slotAvailability(slot, [], 0).available).toBe(4);
});
it("blocks cancelled, started and overlapping legacy sessions", () => {
  expect(slotAvailability(slot, [{ ...occupied(0), status: "cancelled" }], 0).available).toBe(0);
  expect(slotAvailability(slot, [], slot.startsAt).available).toBe(0);
  expect(slotAvailability(slot, [{ ...occupied(1), id: "old-session", startsAt: slot.startsAt - 1800000 }], 0).available).toBe(0);
  expect(slotAvailability(slot, [{ ...occupied(1), id: "old-session", startsAt: slot.endsAt }], 0).available).toBe(4);
});
it("fails closed on corrupt counts and capacity", () => {
  expect(() => slotAvailability(slot, [occupied(5)], 0)).toThrow();
  expect(() => slotAvailability(slot, [{ ...occupied(0), capacity: 8 }], 0)).toThrow();
  expect(() => studioSlots("2026-02-30", "femme")).toThrow();
});
