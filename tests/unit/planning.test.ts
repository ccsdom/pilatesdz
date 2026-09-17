import { expect, it, vi } from "vitest";
import {
  studioDay,
  studioDateTime,
  parseStudioDateTime,
  dayRange,
  sessionInputSchema,
  storedSessionSchema,
  weekRange,
  monthRange,
  getDaysOfWeek,
  getDaysOfMonthGrid,
  startOfWeekDay,
} from "../../src/domain/models/planning";
import { createPlanningService } from "../../src/services/planning";
import type { Access } from "../../src/domain/models/access";

const admin: Access = { uid: "admin", centerId: "alger", role: "admin" };
const client: Access = { uid: "client", centerId: "alger", role: "client" };
it("enforces new course limits while preserving historical sessions", () => {
  const value = { title: "Reformer", instructor: "Coach", startsAt: 1900000000000, durationMinutes: 60, capacity: 4 };
  expect(sessionInputSchema.safeParse(value).success).toBe(true);
  const legacy = { ...value, capacity: 6, durationMinutes: 90 };
  expect(storedSessionSchema.safeParse(legacy).success).toBe(true);
  expect(sessionInputSchema.safeParse(legacy).success).toBe(false);
});
function setup() {
  const repository = { create: vi.fn(), list: vi.fn(), daySessions: vi.fn(), rangeSessions: vi.fn(), listReservations: vi.fn(), pendingAttendance: vi.fn(), get: vi.fn(), book: vi.fn(), cancelBooking: vi.fn(), cancelSession: vi.fn() };
  return { repository, service: createPlanningService(repository) };
}
it("interprets studio input independently of the computer's time zone", () => {
  const timestamp = parseStudioDateTime("2030-01-12T10:30");
  expect(new Date(timestamp).toISOString()).toBe("2030-01-12T09:30:00.000Z");
  expect(studioDateTime(timestamp)).toBe("2030-01-12T10:30");
  expect(studioDay(Date.parse("2030-01-11T23:30:00Z"))).toBe("2030-01-12");
});
it.each(["2030-02-30T10:00", "2030-13-01T10:00", "2030-01-01T25:00", "bad", "2030-01-01"])("rejects invalid studio date %s", (value) => { expect(() => parseStudioDateTime(value)).toThrow(); });
it("uses consecutive local midnights for planning days", () => {
  const range = dayRange("2030-01-12");
  expect(new Date(range.start).toISOString()).toBe("2030-01-11T23:00:00.000Z");
  expect(range.end - range.start).toBe(86400000);
});
it.each([{ capacity: 0 }, { capacity: 5 }, { durationMinutes: 59 }, { durationMinutes: 61 }, { title: " " }, { centerId: "oran" }, { bookedCount: 99 }])("rejects invalid session data %j", (change) => {
  expect(sessionInputSchema.safeParse({ title: "Reformer", instructor: "Coach", startsAt: 1900000000000, durationMinutes: 60, capacity: 4, ...change }).success).toBe(false);
});
it("refuses administration and impersonation by a client before data access", () => {
  const { service, repository } = setup();
  expect(() => service.create(client, "id", {})).toThrow();
  expect(() => service.cancelSession(client, "id")).toThrow();
  expect(() => service.cancelBooking(client, "id", "other-client")).toThrow();
  for (const call of Object.values(repository)) expect(call).not.toHaveBeenCalled();
});
it("reserves only for the session's client, never for an administrator", () => {
  const { service, repository } = setup();
  expect(() => service.book(admin, "id")).toThrow();
  service.book(client, "id"); expect(repository.book).toHaveBeenCalledWith(client, "id");
});
it("validates page cursors and traversal", () => {
  const { service } = setup();
  expect(() => service.list(admin, "not-a-day")).toThrow();
  expect(() => service.list(admin, "2030-01-12", "../other")).toThrow();
  expect(() => service.get(client, "../other")).toThrow();
});

it("allows only an administrator to book for an explicit valid customer", () => {
  const { service, repository } = setup();
  expect(() => service.bookForClient(client, "session", "other")).toThrow();
  expect(() => service.bookForClient(admin, "session", "../other")).toThrow();
  expect(() => service.bookForClient(admin, "../session", "other")).toThrow();
  expect(repository.book).not.toHaveBeenCalled();
  service.bookForClient(admin, "session", "other");
  expect(repository.book).toHaveBeenCalledWith(admin, "session", "other");
});

it("restricts the complete day dashboard to administrators", () => {
  const { repository, service } = setup();
  expect(() => service.daySessions(client, "2030-01-12")).toThrow();
  expect(() => service.daySessions(admin, "bad")).toThrow();
  expect(repository.daySessions).not.toHaveBeenCalled();
  service.daySessions(admin, "2030-01-12");
  expect(repository.daySessions).toHaveBeenCalledWith(admin, "2030-01-12");
});

it("restricts attendance follow-up to administrators and at most 31 valid days", () => {
  const { service, repository } = setup();
  expect(() => service.pendingAttendance(client, "2024-02-01", "2024-02-29")).toThrow();
  for (const [from, to] of [["bad", "2024-02-29"], ["2024-02-30", "2024-03-01"], ["2024-03-02", "2024-03-01"], ["2024-01-01", "2024-02-01"]]) {
    expect(() => service.pendingAttendance(admin, from, to)).toThrow();
  }
  expect(repository.pendingAttendance).not.toHaveBeenCalled();
  service.pendingAttendance(admin, "2024-01-01", "2024-01-31");
  expect(repository.pendingAttendance).toHaveBeenCalledWith(admin, "2024-01-01", "2024-01-31");
});

it("computes week and month date ranges correctly for multi-view planning", () => {
  expect(startOfWeekDay("2026-09-17")).toBe("2026-09-14");
  const weekDays = getDaysOfWeek("2026-09-17");
  expect(weekDays.length).toBe(7);
  expect(weekDays[0]).toBe("2026-09-14");
  expect(weekDays[6]).toBe("2026-09-20");

  const monthGrid = getDaysOfMonthGrid("2026-09");
  expect(monthGrid.length).toBe(42);
  expect(monthGrid[0].date).toBe("2026-08-31");

  const wRange = weekRange("2026-09-17");
  expect(wRange.monday).toBe("2026-09-14");
  expect(wRange.end > wRange.start).toBe(true);

  const mRange = monthRange("2026-09");
  expect(mRange.yearMonth).toBe("2026-09");
  expect(mRange.prevYearMonth).toBe("2026-08");
  expect(mRange.nextYearMonth).toBe("2026-10");
});

it("validates rangeSessions for administrators within 42 days", () => {
  const repository = { create: vi.fn(), list: vi.fn(), daySessions: vi.fn(), rangeSessions: vi.fn(), listReservations: vi.fn(), pendingAttendance: vi.fn(), get: vi.fn(), book: vi.fn(), cancelBooking: vi.fn(), cancelSession: vi.fn() };
  const service = createPlanningService(repository);

  expect(() => service.rangeSessions(client, "2026-09-01", "2026-09-07")).toThrow();
  expect(() => service.rangeSessions(admin, "bad", "2026-09-07")).toThrow();

  service.rangeSessions(admin, "2026-09-01", "2026-09-07");
  expect(repository.rangeSessions).toHaveBeenCalledWith(admin, "2026-09-01", "2026-09-07");
});

it("validates listReservations for administrators only and verifies cursor format", () => {
  const repository = { create: vi.fn(), list: vi.fn(), daySessions: vi.fn(), rangeSessions: vi.fn(), listReservations: vi.fn(), pendingAttendance: vi.fn(), get: vi.fn(), book: vi.fn(), cancelBooking: vi.fn(), cancelSession: vi.fn() };
  const service = createPlanningService(repository);

  expect(() => service.listReservations(client)).toThrow();
  expect(() => service.listReservations(admin, "invalid-cursor")).toThrow();

  service.listReservations(admin, "1789646400000_session1", 20);
  expect(repository.listReservations).toHaveBeenCalledWith(admin, "1789646400000_session1", 20);
});

