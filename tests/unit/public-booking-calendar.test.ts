import { expect, it } from "vitest";
import { bookingCalendarDate, bookingMonthDays, canSelectBookingDay, firstBookingDay, initialBookingDay, shiftBookingMonth } from "../../src/domain/models/public-booking-calendar";
it("opens the following months across year boundaries", () => {
  expect(shiftBookingMonth("2026-09", 1)).toBe("2026-10");
  expect(shiftBookingMonth("2026-12", 1)).toBe("2027-01");
  expect(shiftBookingMonth("2027-01", -1)).toBe("2026-12");
  expect(canSelectBookingDay("2026-10-12", "2026-09-21")).toBe(true);
  expect(canSelectBookingDay("2026-11-16", "2026-09-21")).toBe(true);
});
it("generates every day of a month including leap day", () => {
  expect(bookingMonthDays("2028-02")).toHaveLength(29);
  expect(bookingMonthDays("2028-02").at(-1)).toBe("2028-02-29");
  expect(bookingMonthDays("2027-02")).toHaveLength(28);
  expect(bookingMonthDays("2026-12")).toHaveLength(31);
});
it("uses Alger's day independently of the visitor's local timezone", () => {
  expect(firstBookingDay(Date.parse("2026-09-20T23:30:00Z"))).toBe("2026-09-22");
  expect(bookingCalendarDate("2026-10-12").toISOString().slice(0,10)).toBe("2026-10-12");
});
it("excludes Fridays and past days without imposing a weekly limit", () => {
  expect(initialBookingDay("2026-09-25")).toBe("2026-09-26");
  expect(canSelectBookingDay("2026-10-02", "2026-09-21")).toBe(false);
  expect(canSelectBookingDay("2026-09-20", "2026-09-21")).toBe(false);
  expect(canSelectBookingDay("2026-02-30", "2026-01-01")).toBe(false);
  expect(canSelectBookingDay("", "2026-01-01")).toBe(false);
});
