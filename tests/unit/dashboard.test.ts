import { expect, it } from "vitest";
import { summarizeDay } from "../../src/domain/models/dashboard";
import type { PilatesSession } from "../../src/domain/models/planning";
import { dashboardMonthDays, monthlyCash, monthlyPlanning } from "../../src/domain/models/dashboard-charts";

const session: PilatesSession = { id: "s", centerId: "alger", title: "Reformer", instructor: "Coach", startsAt: 1900000000000, durationMinutes: 60, capacity: 4, bookedCount: 2, status: "scheduled" };
it("fills every day including leap years and rejects invalid periods", () => {
  expect(dashboardMonthDays("2024-02")).toHaveLength(29);
  expect(dashboardMonthDays("2026-02")).toHaveLength(28);
  expect(() => dashboardMonthDays("2026-13")).toThrow();
  expect(monthlyPlanning("2026-09", []).summary.occupancy).toBe(null);
  expect(monthlyCash("2026-09", []).daily).toHaveLength(30);
});
it("groups by the session day in Alger and excludes cancellations and other months", () => {
  const report = monthlyPlanning("2026-09", [
    { ...session, startsAt: Date.parse("2026-08-31T23:30:00Z") },
    { ...session, id: "b", startsAt: Date.parse("2026-09-01T12:00:00Z"), capacity: 1, bookedCount: 1 },
    { ...session, id: "c", startsAt: Date.parse("2026-09-01T12:00:00Z"), status: "cancelled" },
    { ...session, id: "d", startsAt: Date.parse("2026-09-30T23:30:00Z") },
  ]);
  expect(report.daily[0]).toMatchObject({ day: "2026-09-01", bookings: 3, available: 2, occupancy: 60, cancelled: 1 });
  expect(report.summary).toMatchObject({ sessions: 2, bookings: 3, occupancy: 60 });
  expect(report.courses).toEqual([{ name: "Reformer", value: 2 }]);
  expect(report.daily[1].occupancy).toBe(null);
});
it("sums daily cash in minor units and excludes corrected entries", () => {
  const report = monthlyCash("2026-09", [
    { receivedDate: "2026-09-01", amountMinor: 105, corrected: false },
    { receivedDate: "2026-09-01", amountMinor: 200, corrected: true },
    { receivedDate: "2026-09-03", amountMinor: 1, corrected: false },
    { receivedDate: "2026-08-31", amountMinor: 999, corrected: false },
  ]);
  expect(report.summary.netMinor).toBe(106);
  expect(report.daily[0].netMinor).toBe(105);
  expect(report.daily[1].netMinor).toBe(0);
  expect(report.daily.reduce((sum, day) => sum + day.netMinor, 0)).toBe(report.summary.netMinor);
});
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
