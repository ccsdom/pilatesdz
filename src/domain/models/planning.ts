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
