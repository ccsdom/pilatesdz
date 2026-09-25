import { parseStudioDateTime } from "./planning";
import { COURSE_DURATION_MINUTES, COURSE_MAX_CAPACITY } from "./studio-offers";
import { defaultStudioOpening, openingRanges, type StudioOpening } from "./studio-opening";

export type SlotAudience = "femme" | "homme";
export type StudioSlot = { id: string; time: string; startsAt: number; endsAt: number; totalCapacity: number; reserved: number; available: number; status: "available" | "limited" | "full" };
export type SlotOccupancy = { id: string; startsAt: number; durationMinutes: number; capacity: number; bookedCount: number; status: "scheduled" | "cancelled" };

/** Preserve the historical public identifiers; an activity never adds capacity. */
export function studioSlots(day: string, audience: SlotAudience, opening: StudioOpening = defaultStudioOpening()): StudioSlot[] {
  const time = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  return openingRanges(day, opening).filter(range => range.audience === audience).flatMap(range =>
    Array.from({ length: (range.endMinute - range.startMinute) / COURSE_DURATION_MINUTES }, (_, index) => {
    const minute = range.startMinute + index * COURSE_DURATION_MINUTES;
    const start = time(minute);
    const end = time(minute + COURSE_DURATION_MINUTES);
    const startsAt = parseStudioDateTime(`${day}T${start}`);
    return { id: `pub_${day}_${start.replace(":", "")}_${audience}`, time: `${start} - ${end}`, startsAt, endsAt: startsAt + COURSE_DURATION_MINUTES * 60000, totalCapacity: COURSE_MAX_CAPACITY, reserved: 0, available: COURSE_MAX_CAPACITY, status: "available" };
  }));
}

export function slotAvailability(slot: StudioSlot, sessions: SlotOccupancy[], now: number): StudioSlot {
  const overlapping = sessions.filter(session => session.startsAt < slot.endsAt && session.startsAt + session.durationMinutes * 60000 > slot.startsAt);
  const own = overlapping.find(session => session.id === slot.id);
  // A legacy/manual session occupies this time: never create a parallel capacity.
  const blocked = slot.startsAt <= now || overlapping.some(session => session.id !== slot.id) || own?.status === "cancelled";
  if (own && (!Number.isInteger(own.bookedCount) || own.bookedCount < 0 || !Number.isInteger(own.capacity) || own.capacity < 1 || own.capacity > COURSE_MAX_CAPACITY || own.bookedCount > own.capacity || own.startsAt !== slot.startsAt || own.durationMinutes !== COURSE_DURATION_MINUTES)) throw new Error("Invalid slot occupancy");
  const totalCapacity = own?.capacity ?? slot.totalCapacity;
  const reserved = own?.bookedCount ?? 0;
  const available = blocked ? 0 : totalCapacity - reserved;
  return { ...slot, totalCapacity, reserved, available, status: available === 0 ? "full" : available <= 2 ? "limited" : "available" };
}
