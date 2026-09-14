import { z } from "zod";
import { clientIdSchema } from "./client";
import type { PilatesSession } from "./planning";
export type PendingAttendanceReport = { from: string; to: string; pending: number; sessions: { session: PilatesSession; pending: number; total: number }[] };
export const attendanceStatusSchema = z.enum(["unmarked", "present", "absent"]);
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;
export const attendanceLabels: Record<AttendanceStatus, string> = { unmarked: "Non renseignée", present: "Présente", absent: "Absente" };
export type Attendance = { status: AttendanceStatus; version: number };
export const attendanceInputSchema = z.object({
  id: clientIdSchema, clientId: clientIdSchema, requestId: z.string().uuid(),
  version: z.number().int().min(0).max(1000000), status: attendanceStatusSchema,
  reason: z.string().trim().max(300).default(""),
}).strict().refine((value) => value.version === 0 || value.reason.length >= 5, "Motif de correction requis.");
export type AttendanceInput = z.infer<typeof attendanceInputSchema>;
export type AttendanceEvent = { id: string; from: AttendanceStatus; to: AttendanceStatus; version: number; at: number; actorUid: string; reason: string };
export function readAttendance(value: unknown): Attendance {
  if (value === undefined) return { status: "unmarked", version: 0 };
  const parsed = z.object({ status: attendanceStatusSchema, version: z.number().int().min(1).max(1000000) }).safeParse(value);
  if (!parsed.success) throw new Error("Invalid attendance record");
  return parsed.data;
}
export function attendanceOpen(session: { startsAt: number; durationMinutes: number; status: string }, now: number) {
  return session.status === "scheduled" && now >= session.startsAt + session.durationMinutes * 60000;
}
