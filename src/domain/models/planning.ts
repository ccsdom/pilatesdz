import { z } from "zod";
import type { Attendance } from "./attendance";
import { COURSE_DURATION_MINUTES, COURSE_MAX_CAPACITY } from "./studio-offers";

export const STUDIO_TIME_ZONE = "Africa/Algiers";
const localFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: STUDIO_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export function studioDateTime(timestamp: number) {
  const parts = Object.fromEntries(localFormatter.formatToParts(timestamp).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
export function parseStudioDateTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Date invalide.");
  const nominal = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(nominal)) throw new Error("Date invalide.");
  let candidate = nominal;
  for (let step = 0; step < 3; step++) candidate += nominal - Date.parse(`${studioDateTime(candidate)}:00Z`);
  if (studioDateTime(candidate) !== value) throw new Error("Date invalide.");
  return candidate;
}
export function studioDay(timestamp = Date.now()) { return studioDateTime(timestamp).slice(0, 10); }
export function dayRange(day: string) {
  const start = parseStudioDateTime(`${day}T00:00`);
  const nextDay = new Date(Date.parse(`${day}T12:00:00Z`) + 86400000).toISOString().slice(0, 10);
  return { start, end: parseStudioDateTime(`${nextDay}T00:00`) };
}
export function startOfWeekDay(day: string) {
  const noon = Date.parse(`${day.slice(0, 10)}T12:00:00Z`);
  const utcDay = new Date(noon).getUTCDay();
  const dayIndex = (utcDay + 6) % 7; // 0=Mon, 1=Tue, ..., 6=Sun
  const mondayNoon = noon - dayIndex * 86400000;
  return studioDay(mondayNoon);
}
export function weekRange(day: string) {
  const monday = startOfWeekDay(day);
  const start = parseStudioDateTime(`${monday}T00:00`);
  const nextMonday = studioDay(Date.parse(`${monday}T12:00:00Z`) + 7 * 86400000);
  const end = parseStudioDateTime(`${nextMonday}T00:00`);
  return { start, end, monday, nextMonday };
}
export function monthRange(yearMonth: string) {
  const ym = yearMonth.slice(0, 7);
  const [yStr, mStr] = ym.split("-");
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const firstDay = `${ym}-01`;
  const nextY = m === 12 ? y + 1 : y;
  const nextM = m === 12 ? 1 : m + 1;
  const nextYm = `${nextY}-${String(nextM).padStart(2, "0")}`;
  const firstDayNextMonth = `${nextYm}-01`;
  return {
    start: parseStudioDateTime(`${firstDay}T00:00`),
    end: parseStudioDateTime(`${firstDayNextMonth}T00:00`),
    yearMonth: ym,
    nextYearMonth: nextYm,
    prevYearMonth: `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, "0")}`,
  };
}
export function getDaysOfWeek(day: string): string[] {
  const monday = startOfWeekDay(day);
  const mondayNoon = Date.parse(`${monday}T12:00:00Z`);
  return Array.from({ length: 7 }, (_, i) => studioDay(mondayNoon + i * 86400000));
}
export function getDaysOfMonthGrid(yearMonth: string) {
  const ym = yearMonth.slice(0, 7);
  const firstDay = `${ym}-01`;
  const gridStartDay = startOfWeekDay(firstDay);
  const startNoon = Date.parse(`${gridStartDay}T12:00:00Z`);
  const totalDays = 42; // 6 weeks grid
  return Array.from({ length: totalDays }, (_, i) => {
    const date = studioDay(startNoon + i * 86400000);
    return {
      date,
      dayNumber: parseInt(date.slice(8, 10), 10),
      isCurrentMonth: date.startsWith(ym),
    };
  });
}
export function displaySessionTime(timestamp: number) {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: STUDIO_TIME_ZONE, dateStyle: "full", timeStyle: "short" }).format(timestamp);
}
// Historical sessions retain their original duration and capacity.
export const storedSessionSchema = z.object({
  title: z.string().trim().min(1).max(80), instructor: z.string().trim().min(1).max(80),
  startsAt: z.number().int().positive().max(8640000000000000),
  durationMinutes: z.number().int().min(15).max(180), capacity: z.number().int().min(1).max(30),
}).strict();
export const sessionInputSchema = storedSessionSchema.extend({
  durationMinutes: z.number().int().min(COURSE_DURATION_MINUTES).max(COURSE_DURATION_MINUTES),
  capacity: z.number().int().min(1).max(COURSE_MAX_CAPACITY),
});
export type SessionInput = z.infer<typeof sessionInputSchema>;
export type PilatesSession = SessionInput & { id: string; centerId: string; status: "scheduled" | "cancelled"; bookedCount: number };
export type BookingStatus = "none" | "confirmed" | "cancelled" | "session-cancelled";
export type SessionView = { session: PilatesSession; myBooking: BookingStatus };
export type PlanningPage = { sessions: SessionView[]; next: string | null; day: string };
export type SessionDetails = SessionView & { attendees: { clientId: string; name: string; attendance: Attendance }[] };
