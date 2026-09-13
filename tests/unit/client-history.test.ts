import { expect, it, vi } from "vitest";
import { monthRange, historyStatus, historySummary, type HistoryEntry, type HistoryStatus } from "../../src/domain/models/client-history";
import { createClientHistoryService } from "../../src/services/client-history";
it("uses Alger month boundaries including leap years", () => {
  const range = monthRange("2024-02");
  expect(new Date(range.start).toISOString()).toBe("2024-01-31T23:00:00.000Z");
  expect(range.end - range.start).toBe(29 * 86400000);
  expect(new Date(monthRange("2024-12").end).toISOString()).toBe("2024-12-31T23:00:00.000Z");
});
it.each(["bad", "2026-13", "2026-1", "1999-12", "2101-01"])("rejects invalid month %s", (month) => { expect(() => monthRange(month)).toThrow(); });
it("separates future, in-progress and unmarked ended courses", () => {
  const session = { status: "scheduled", startsAt: 1000, durationMinutes: 60 };
  const booking = { status: "confirmed", attendance: "unmarked" as const };
  expect(historyStatus(session, booking, 999)).toBe("upcoming");
  expect(historyStatus(session, booking, 1000)).toBe("in-progress");
  expect(historyStatus(session, booking, 3601000)).toBe("unmarked");
  expect(historyStatus({ ...session, status: "cancelled" }, booking, 999)).toBe("session-cancelled");
  expect(historyStatus(session, { ...booking, status: "cancelled", attendance: "present" }, 3601000)).toBe("cancelled");
});
it("uses only known attendance as the rate denominator", () => {
  const entries = (["present", "absent", "unmarked", "cancelled", "session-cancelled", "upcoming", "in-progress"] as HistoryStatus[]).map((status): HistoryEntry => ({ id: status, title: "Cours", instructor: "Coach", startsAt: 1, durationMinutes: 60, status }));
  const summary = historySummary(entries);
  expect(summary.attendanceRate).toBe(50); expect(summary.unmarked).toBe(1);
  expect(historySummary([]).attendanceRate).toBeNull();
  expect(historySummary(entries.filter((entry) => entry.status === "unmarked")).attendanceRate).toBeNull();
});
it("rejects client impersonation and malformed cursors before persistence", () => {
  const repo = { list: vi.fn() }; const service = createClientHistoryService(repo);
  expect(() => service.list({ uid: "c", role: "client", centerId: "alger" }, "2026-09", "other")).toThrow();
  expect(() => service.list({ uid: "a", role: "admin", centerId: "alger" }, "2026-09", "c", "bad")).toThrow();
  expect(repo.list).not.toHaveBeenCalled();
});
