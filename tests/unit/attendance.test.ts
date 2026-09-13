import { expect, it, vi } from "vitest";
import { attendanceInputSchema, attendanceOpen, readAttendance } from "../../src/domain/models/attendance";
import { createAttendanceService } from "../../src/services/attendance";
const input = { id: "session", clientId: "client", requestId: "123e4567-e89b-42d3-a456-426614174000", status: "present", version: 0 };
it("opens attendance at the end of a scheduled course only", () => {
  const session = { status: "scheduled", startsAt: 1000, durationMinutes: 60 };
  expect(attendanceOpen(session, 3600999)).toBe(false);
  expect(attendanceOpen(session, 3601000)).toBe(true);
  expect(attendanceOpen({ ...session, status: "cancelled" }, 3601000)).toBe(false);
});
it("treats old bookings as unmarked but rejects corrupt pointages", () => {
  expect(readAttendance(undefined)).toEqual({ status: "unmarked", version: 0 });
  expect(() => readAttendance({ status: "present", version: 0 })).toThrow();
  expect(() => readAttendance(null)).toThrow();
});
it.each([{ version: -1 }, { status: "late" }, { id: "../other" }, { version: 1 }, { version: 1, reason: "x" }, { reason: "x".repeat(301) }, { centerId: "oran" }])("rejects invalid attendance input %j", (change) => {
  expect(attendanceInputSchema.safeParse({ ...input, ...change }).success).toBe(false);
});
it("permits a justified correction back to unmarked", () => {
  expect(attendanceInputSchema.safeParse({ ...input, version: 2, status: "unmarked", reason: "À vérifier avec la coach" }).success).toBe(true);
});
it("rejects client writes and history before persistence", () => {
  const repo = { mark: vi.fn(), history: vi.fn() };
  const service = createAttendanceService(repo);
  const actor = { uid: "c", centerId: "alger", role: "client" as const };
  expect(() => service.mark(actor, input)).toThrow();
  expect(() => service.history(actor, "s", "c")).toThrow();
  expect(repo.mark).not.toHaveBeenCalled(); expect(repo.history).not.toHaveBeenCalled();
});
