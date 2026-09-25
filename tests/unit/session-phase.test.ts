import { expect, it } from "vitest";
import { parseStudioDateTime, sessionPhase } from "../../src/domain/models/planning";

const startsAt = parseStudioDateTime("2026-12-31T23:30");
const session = { startsAt, durationMinutes: 60, status: "scheduled" as const };

it.each([
  [-1, "upcoming"],
  [0, "ongoing"],
  [30 * 60000, "ongoing"],
  [60 * 60000 - 1, "ongoing"],
  [60 * 60000, "ended"],
  [90 * 60000, "ended"],
])("classifies a session across midnight at offset %s", (offset, expected) => {
  expect(sessionPhase(session, startsAt + offset)).toBe(expected);
});

it.each([-1, 0, 60 * 60000])("keeps cancelled sessions cancelled at offset %s", offset => {
  expect(sessionPhase({ ...session, status: "cancelled" }, startsAt + offset)).toBe("cancelled");
});

it("respects historical durations instead of assuming one hour", () => {
  expect(sessionPhase({ ...session, durationMinutes: 90 }, startsAt + 60 * 60000)).toBe("ongoing");
  expect(sessionPhase({ ...session, durationMinutes: 90 }, startsAt + 90 * 60000)).toBe("ended");
});
