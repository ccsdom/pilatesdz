import { expect, it, vi } from "vitest";
import { studioDay, studioDateTime, parseStudioDateTime, dayRange, sessionInputSchema, storedSessionSchema } from "../../src/domain/models/planning";
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
  const repository = { create: vi.fn(), list: vi.fn(), get: vi.fn(), book: vi.fn(), cancelBooking: vi.fn(), cancelSession: vi.fn() };
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
