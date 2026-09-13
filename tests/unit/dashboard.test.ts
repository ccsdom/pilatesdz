import { expect, it } from "vitest";
import { summarizeDay } from "../../src/domain/models/dashboard";
import type { PilatesSession } from "../../src/domain/models/planning";

const session: PilatesSession = { id: "s", centerId: "alger", title: "Reformer", instructor: "Coach", startsAt: 1900000000000, durationMinutes: 60, capacity: 4, bookedCount: 2, status: "scheduled" };
it("does not invent occupancy for an empty day", () => {
  expect(summarizeDay([])).toEqual({ sessions: 0, cancelled: 0, bookings: 0, available: 0, occupancy: null });
});
it("excludes cancelled courses and weights occupancy by actual capacity", () => {
  expect(summarizeDay([session, { ...session, id: "b", capacity: 1, bookedCount: 1 }, { ...session, id: "c", status: "cancelled", bookedCount: 4 }]))
    .toEqual({ sessions: 2, cancelled: 1, bookings: 3, available: 2, occupancy: 60 });
});
it("counts all sessions beyond the four-row preview and distinguishes zero bookings", () => {
  expect(summarizeDay(Array.from({ length: 55 }, (_, i) => ({ ...session, id: String(i) })))).toMatchObject({ sessions: 55, bookings: 110, available: 110, occupancy: 50 });
  expect(summarizeDay([{ ...session, bookedCount: 0 }]).occupancy).toBe(0);
});
