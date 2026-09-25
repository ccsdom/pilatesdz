import { expect, it } from "vitest";
import { isSessionAvailable, sessionsInMonth } from "../../src/domain/models/planning-display";
import { parseStudioDateTime, type PilatesSession } from "../../src/domain/models/planning";

const session: PilatesSession = { id: "test", centerId: "alger", title: "Test", instructor: "Studio", startsAt: parseStudioDateTime("2026-10-01T00:00"), durationMinutes: 60, capacity: 4, bookedCount: 0, status: "scheduled" };
it("closes availability exactly at the start, not at the end", () => {
  expect(isSessionAvailable(session, session.startsAt - 1)).toBe(true);
  expect(isSessionAvailable(session, session.startsAt)).toBe(false);
  expect(isSessionAvailable(session, session.startsAt + 3600000)).toBe(false);
});
it("excludes full and cancelled future sessions", () => {
  expect(isSessionAvailable({ ...session, bookedCount: 4 }, session.startsAt - 1)).toBe(false);
  expect(isSessionAvailable({ ...session, status: "cancelled" }, session.startsAt - 1)).toBe(false);
});
it("uses the Alger month boundary and excludes neighboring grid days", () => {
  const previous = { ...session, id: "previous", startsAt: session.startsAt - 1 };
  const next = { ...session, id: "next", startsAt: parseStudioDateTime("2026-11-01T00:00") };
  expect(sessionsInMonth([previous, session, next], "2026-10")).toEqual([session]);
});
