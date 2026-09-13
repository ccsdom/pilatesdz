import type { PilatesSession } from "./planning";

export function summarizeDay(sessions: PilatesSession[]) {
  const scheduled = sessions.filter(session => session.status === "scheduled");
  const capacity = scheduled.reduce((sum, session) => sum + session.capacity, 0);
  const bookings = scheduled.reduce((sum, session) => sum + session.bookedCount, 0);
  return {
    sessions: scheduled.length,
    cancelled: sessions.length - scheduled.length,
    bookings,
    available: capacity - bookings,
    occupancy: capacity === 0 ? null : Math.round(bookings * 100 / capacity),
  };
}
export type DaySummary = ReturnType<typeof summarizeDay>;
