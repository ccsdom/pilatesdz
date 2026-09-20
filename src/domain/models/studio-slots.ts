import { bookingCalendarDate } from "./public-booking-calendar";
import { parseStudioDateTime } from "./planning";
import { COURSE_DURATION_MINUTES, COURSE_MAX_CAPACITY } from "./studio-offers";

export type SlotAudience = "femme" | "homme";
export type StudioSlot = { id: string; time: string; startsAt: number; endsAt: number; totalCapacity: number; reserved: number; available: number; status: "available" | "limited" | "full" };
export type SlotOccupancy = { id: string; startsAt: number; durationMinutes: number; capacity: number; bookedCount: number; status: "scheduled" | "cancelled" };

/** Preserve the historical public identifiers; an activity never adds capacity. */
export function studioSlots(day: string, audience: SlotAudience): StudioSlot[] {
  const weekday = bookingCalendarDate(day).getUTCDay();
  if (weekday === 5) return [];
  const change = [6, 1, 3].includes(weekday) ? 14 : 18;
  const from = audience === "femme" ? 10 : change;
  const to = audience === "femme" ? change : 20;
  return Array.from({ length: to - from }, (_, index) => {
    const hour = from + index;
    const start = `${String(hour).padStart(2, "0")}:00`;
    const end = `${String(hour + 1).padStart(2, "0")}:00`;
    const startsAt = parseStudioDateTime(`${day}T${start}`);
    return { id: `pub_${day}_${start.replace(":", "")}_${audience}`, time: `${start} - ${end}`, startsAt, endsAt: startsAt + COURSE_DURATION_MINUTES * 60000, totalCapacity: COURSE_MAX_CAPACITY, reserved: 0, available: COURSE_MAX_CAPACITY, status: "available" };
  });
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
