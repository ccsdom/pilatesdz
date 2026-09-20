import { studioDay } from "./planning";

// Calendar dates are UTC markers, never instants in the visitor's time zone.
export function bookingCalendarDate(day: string): Date {
  const date = new Date(`${day}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day) throw new Error("Date invalide.");
  return date;
}
export function firstBookingDay(now: number): string {
  return new Date(bookingCalendarDate(studioDay(now)).getTime() + 86400000).toISOString().slice(0, 10);
}
export function canSelectBookingDay(day: string, minimum: string): boolean {
  try { return day >= minimum && bookingCalendarDate(day).getUTCDay() !== 5; } catch { return false; }
}
export function initialBookingDay(minimum: string): string {
  const date = bookingCalendarDate(minimum);
  if (date.getUTCDay() === 5) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
export function shiftBookingMonth(month: string, offset: number): string {
  const date = bookingCalendarDate(`${month}-01`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}
export function bookingMonthDays(month: string): string[] {
  const date = bookingCalendarDate(`${month}-01`), days: string[] = [];
  while (date.toISOString().slice(0, 7) === month) {
    days.push(date.toISOString().slice(0, 10));
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return days;
}
