import { dayRange } from "./planning";
import type { AttendanceStatus } from "./attendance";
export type HistoryStatus = AttendanceStatus | "upcoming" | "in-progress" | "cancelled" | "session-cancelled";
export const historyLabels: Record<HistoryStatus, string> = { unmarked: "Présence non renseignée", present: "Présente", absent: "Absente", upcoming: "À venir", "in-progress": "En cours", cancelled: "Réservation annulée", "session-cancelled": "Séance annulée" };
export type HistoryEntry = { id: string; title: string; instructor: string; startsAt: number; durationMinutes: number; status: HistoryStatus };
export function monthRange(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || Number(month.slice(0, 4)) < 2000 || Number(month.slice(0, 4)) > 2100) throw new Error("Mois invalide.");
  const start = dayRange(`${month}-01`).start;
  const [year, number] = month.split("-").map(Number);
  const next = `${number === 12 ? year + 1 : year}-${String(number === 12 ? 1 : number + 1).padStart(2, "0")}`;
  return { start, end: dayRange(`${next}-01`).start };
}
export function historyStatus(session: { status: string; startsAt: number; durationMinutes: number }, booking: { status: string; attendance: AttendanceStatus }, now: number): HistoryStatus {
  if (booking.status === "cancelled") return "cancelled";
  if (session.status === "cancelled") return "session-cancelled";
  if (session.startsAt > now) return "upcoming";
  if (session.startsAt + session.durationMinutes * 60000 > now) return "in-progress";
  return booking.attendance;
}
export function historySummary(entries: HistoryEntry[]) {
  const counts = { present: 0, absent: 0, unmarked: 0, upcoming: 0, "in-progress": 0, cancelled: 0, "session-cancelled": 0 };
  for (const entry of entries) counts[entry.status]++;
  const marked = counts.present + counts.absent;
  return { ...counts, attendanceRate: marked ? Math.round(counts.present / marked * 100) : null };
}
export type ClientHistoryPage = { month: string; entries: HistoryEntry[]; summary: ReturnType<typeof historySummary>; next: string | null };
