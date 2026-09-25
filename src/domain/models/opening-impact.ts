import { studioDay } from "./planning";
import { studioSlots, type SlotOccupancy } from "./studio-slots";
import { studioOpeningSchema, type StudioOpening } from "./studio-opening";

export type OpeningImpactSession = SlotOccupancy & { createdBy: string };
export type OpeningImpact = {
  conflictingBookings: string[];
  obsoleteEmptySlots: string[];
  preservedManualSessions: string[];
};

/** Pure preview only: never cancels a session or adjusts credits.
 * The caller must supply every session in the affected period and recheck
 * within the save transaction. An empty preview is not a save authorization.
 */
export function openingImpact(opening: StudioOpening, sessions: OpeningImpactSession[], now: number): OpeningImpact {
  studioOpeningSchema.parse(opening);
  if (!Number.isFinite(now)) throw new Error("Date de contrôle invalide.");
  const result: OpeningImpact = { conflictingBookings: [], obsoleteEmptySlots: [], preservedManualSessions: [] };
  const ids = new Set<string>();
  for (const session of sessions) {
    if (ids.has(session.id) || !Number.isFinite(session.startsAt) || !Number.isInteger(session.durationMinutes) || session.durationMinutes < 1 ||
      !Number.isInteger(session.capacity) || session.capacity < 1 || !Number.isInteger(session.bookedCount) || session.bookedCount < 0 || session.bookedCount > session.capacity ||
      !["scheduled", "cancelled"].includes(session.status)) throw new Error("Séance invalide dans le calcul d’impact.");
    ids.add(session.id);
    if (session.startsAt <= now || session.status === "cancelled") continue;
    const day = studioDay(session.startsAt);
    const slots = [...studioSlots(day, "femme", opening), ...studioSlots(day, "homme", opening)];
    const automatic = ["automatic_slots", "online_booking"].includes(session.createdBy) && /^pub_\d{4}-\d{2}-\d{2}_\d{4}_(femme|homme)$/.test(session.id);
    if (!automatic) {
      result.preservedManualSessions.push(session.id);
      continue;
    }
    const stillOpen = slots.some(slot => slot.id === session.id && slot.startsAt === session.startsAt && slot.endsAt === session.startsAt + session.durationMinutes * 60000 && session.capacity <= slot.totalCapacity);
    if (stillOpen) continue;
    (session.bookedCount > 0 ? result.conflictingBookings : result.obsoleteEmptySlots).push(session.id);
  }
  return result;
}
