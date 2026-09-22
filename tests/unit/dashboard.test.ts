import { expect, it } from "vitest";
import { summarizeDay } from "../../src/domain/models/dashboard";
import type { PilatesSession } from "../../src/domain/models/planning";
import { dashboardMonthDays, formatMonthlyReportCsv, hourlyAttendance, monthlyCash, monthlyPlanning } from "../../src/domain/models/dashboard-charts";

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
  expect(report.timeSlots).toBeDefined();
});
it("sums daily cash in minor units, excludes corrected entries, and calculates active days average", () => {
  const report = monthlyCash("2026-09", [
    { receivedDate: "2026-09-01", amountMinor: 105, corrected: false },
    { receivedDate: "2026-09-01", amountMinor: 200, corrected: true },
    { receivedDate: "2026-09-03", amountMinor: 300, corrected: false },
    { receivedDate: "2026-08-31", amountMinor: 999, corrected: false },
  ]);
  expect(report.summary.netMinor).toBe(405);
  expect(report.daily[0].netMinor).toBe(105);
  expect(report.daily[1].netMinor).toBe(0);
  expect(report.summary.activeDaysCount).toBe(2);
  expect(report.summary.averageMinorPerActiveDay).toBe(203);
  expect(report.daily.reduce((sum, day) => sum + day.netMinor, 0)).toBe(report.summary.netMinor);
});
it("correctly aggregates hourly attendance into time slots", () => {
  const slots = hourlyAttendance([
    { ...session, startsAt: Date.parse("2026-09-01T09:00:00Z"), capacity: 4, bookedCount: 3 },
    { ...session, id: "b", startsAt: Date.parse("2026-09-01T13:00:00Z"), capacity: 4, bookedCount: 4 },
    { ...session, id: "c", startsAt: Date.parse("2026-09-01T18:30:00Z"), capacity: 4, bookedCount: 2 },
    { ...session, id: "d", startsAt: Date.parse("2026-09-01T10:00:00Z"), status: "cancelled", capacity: 4, bookedCount: 4 },
  ]);
  expect(slots).toEqual([
    { slot: "Matin (08h-12h)", sessions: 1, bookings: 3, capacity: 4 },
    { slot: "Midi (12h-15h)", sessions: 1, bookings: 4, capacity: 4 },
    { slot: "Après-midi (15h-18h)", sessions: 0, bookings: 0, capacity: 0 },
    { slot: "Soir (18h+)", sessions: 1, bookings: 2, capacity: 4 },
  ]);
});
it("formats a complete monthly report CSV with BOM and French headers", () => {
  const planning = monthlyPlanning("2026-09", [{ ...session, startsAt: Date.parse("2026-09-01T10:00:00Z") }]);
  const cash = monthlyCash("2026-09", [{ receivedDate: "2026-09-01", amountMinor: 500000, corrected: false }]);
  const csv = formatMonthlyReportCsv("2026-09", planning, cash);
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain("Jour;Date;Séances maintenues;Réservations;Places non réservées;Taux de remplissage;Encaissements nets (DA)");
  expect(csv).toContain('"2026-09-01"');
  expect(csv).toContain('"5000,00"');
  expect(csv.split("\r\n")).toHaveLength(31);
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

