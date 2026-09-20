import "server-only";
import type { Firestore, DocumentData } from "firebase-admin/firestore";
import { dayRange } from "@/domain/models/planning";
import { slotAvailability, studioSlots, type SlotAudience, type SlotOccupancy } from "@/domain/models/studio-slots";

export function readSlotOccupancy(id: string, centerId: string, data: DocumentData): SlotOccupancy {
  if (data.id !== id || data.centerId !== centerId || !Number.isFinite(data.startsAt) || !Number.isInteger(data.durationMinutes) || data.durationMinutes < 15 || data.durationMinutes > 180 || !Number.isInteger(data.capacity) || data.capacity < 1 || !Number.isInteger(data.bookedCount) || data.bookedCount < 0 || data.bookedCount > data.capacity || !["scheduled", "cancelled"].includes(data.status)) throw new Error("Invalid planning record");
  return { id, startsAt: data.startsAt, durationMinutes: data.durationMinutes, capacity: data.capacity, bookedCount: data.bookedCount, status: data.status };
}

export function publicDayQuery(db: Firestore, centerId: string, day: string) {
  if (!/^[a-z0-9-]+$/.test(centerId)) throw new Error("Invalid center");
  const range = dayRange(day);
  return db.collection(`centers/${centerId}/sessions`).where("startsAt", ">=", range.start - 180 * 60000).where("startsAt", "<", range.end).orderBy("startsAt").limit(101);
}

export async function publicAvailability(db: Firestore, centerId: string, day: string, audience: SlotAudience, now = Date.now()) {
  const snapshot = await publicDayQuery(db, centerId, day).get();
  if (snapshot.size > 100) throw new Error("Planning needs review");
  const sessions = snapshot.docs.map(doc => readSlotOccupancy(doc.id, centerId, doc.data()));
  return studioSlots(day, audience).map(slot => slotAvailability(slot, sessions, now));
}
