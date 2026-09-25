import { studioDay, type PilatesSession } from "./planning";

export function isSessionAvailable(session: PilatesSession, now: number) {
  return session.status === "scheduled" && session.startsAt > now && session.bookedCount < session.capacity;
}

export function sessionsInMonth(sessions: PilatesSession[], month: string) {
  return sessions.filter(session => studioDay(session.startsAt).startsWith(`${month}-`));
}
