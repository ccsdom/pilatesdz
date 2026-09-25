import "server-only";
import type { Firestore, Transaction, DocumentData } from "firebase-admin/firestore";
import { AccessError, isCenterOperator, type Access } from "@/domain/models/access";
import { clientIdSchema } from "@/domain/models/client";
import { decodeOpeningPolicy, encodeOpeningPolicy, emptyOpeningPolicy, openingForDay } from "@/domain/models/opening-policy";
import { studioOpeningSchema, type StudioOpening } from "@/domain/models/studio-opening";
import { firstBookingDay } from "@/domain/models/public-booking-calendar";
import { dayRange, studioDay } from "@/domain/models/planning";
import { studioSlots } from "@/domain/models/studio-slots";
import { ManagementError } from "@/domain/ports/access-management";

export function openingRef(db: Firestore, centerId: string) {
  if (!/^[a-z0-9-]+$/.test(centerId)) throw new AccessError(403);
  return db.doc(`centers/${centerId}/settings/opening`);
}
export async function readOpeningPolicy(db: Firestore, centerId: string, tx?: Transaction) {
  const ref = openingRef(db, centerId);
  const snapshot = tx ? await tx.get(ref) : await ref.get();
  return snapshot.exists ? decodeOpeningPolicy(snapshot.data()) : emptyOpeningPolicy();
}
export function automaticSession(id: string, data: DocumentData) {
  return ["automatic_slots", "online_booking"].includes(data.createdBy) && /^pub_\d{4}-\d{2}-\d{2}_\d{4}_(femme|homme)$/.test(id);
}
export function compatibleOpening(id: string, data: DocumentData, opening: StudioOpening) {
  const day = studioDay(data.startsAt);
  return [...studioSlots(day, "femme", opening), ...studioSlots(day, "homme", opening)].some(slot => slot.id === id && slot.startsAt === data.startsAt && data.durationMinutes === 60 && data.capacity <= 4);
}
export async function assertOpeningForBooking(db: Firestore, tx: Transaction, centerId: string, id: string, data: DocumentData) {
  const policy = await readOpeningPolicy(db, centerId, tx);
  if (automaticSession(id, data) && (data.openingClosed === true || !compatibleOpening(id, data, openingForDay(policy, studioDay(data.startsAt))))) throw new ManagementError(409, "Ce créneau est fermé. Choisissez un autre horaire.");
}
export type OpeningReview = { conflicts: { id: string; startsAt: number; bookedCount: number }[]; closing: number; reopening: number; manual: number };
async function authorize(db: Firestore, tx: Transaction, actor: Access) {
  if (!isCenterOperator(actor.role) || !clientIdSchema.safeParse(actor.uid).success) throw new AccessError(403);
  openingRef(db, actor.centerId);
  const member = (await tx.get(db.doc(`centers/${actor.centerId}/members/${actor.uid}`))).data();
  if (!member || member.uid !== actor.uid || member.centerId !== actor.centerId || member.role !== actor.role || member.active !== true) throw new AccessError(403);
}
export async function getOpeningSettings(db: Firestore, actor: Access) {
  return db.runTransaction(async tx => { await authorize(db, tx, actor); return readOpeningPolicy(db, actor.centerId, tx); });
}
export async function reviewOpeningSettings(db: Firestore, actor: Access, opening: StudioOpening, effectiveFrom: string, expectedVersion: number, save: boolean, now = Date.now()) {
  const valid = studioOpeningSchema.parse(opening);
  const start = dayRange(effectiveFrom).start;
  if (effectiveFrom < firstBookingDay(now)) throw new ManagementError(400, "La date d’effet doit être au plus tôt demain.");
  return db.runTransaction(async tx => {
    await authorize(db, tx, actor);
    const policy = await readOpeningPolicy(db, actor.centerId, tx);
    if (policy.version !== expectedVersion) throw new ManagementError(409, "Les horaires ont changé. Rechargez la page avant de réessayer.");
    if (effectiveFrom < (policy.revisions.at(-1)?.effectiveFrom ?? "")) throw new ManagementError(409, "Choisissez une date au moins égale au dernier changement programmé.");
    if (policy.revisions.length >= 100) throw new ManagementError(409, "L’historique doit être archivé avant un nouveau changement.");
    const sessions = await tx.get(db.collection(`centers/${actor.centerId}/sessions`).where("startsAt", ">=", start - 180 * 60000).orderBy("startsAt").limit(401));
    if (sessions.size > 400) throw new ManagementError(409, "Plus de 400 créneaux sont concernés. Choisissez une date d’effet plus tardive ou contactez le support.");
    const review: OpeningReview = { conflicts: [], closing: 0, reopening: 0, manual: 0 };
    const updates: { ref: typeof sessions.docs[number]["ref"]; closed: boolean }[] = [];
    const occupancyAfterChange = new Map(sessions.docs.map(doc => {
      const data = doc.data();
      return [doc.id, data.status === "cancelled" || !automaticSession(doc.id, data) || compatibleOpening(doc.id, data, valid)];
    }));
    for (const doc of sessions.docs) {
      const data = doc.data();
      if (data.id !== doc.id || data.centerId !== actor.centerId || !Number.isFinite(data.startsAt) || !Number.isInteger(data.bookedCount) || data.bookedCount < 0 || !Number.isInteger(data.capacity) || data.capacity < 1 || data.bookedCount > data.capacity || !["scheduled", "cancelled"].includes(data.status)) throw new Error("Invalid session in opening review");
      if (data.startsAt < start || data.status === "cancelled") continue;
      if (!automaticSession(doc.id, data)) { review.manual++; continue; }
      const blockedByOther = sessions.docs.some(other => {
        if (other.id === doc.id) return false;
        const value = other.data();
        const occupiesAfterChange = occupancyAfterChange.get(other.id);
        return occupiesAfterChange && value.startsAt < data.startsAt + data.durationMinutes * 60000 && value.startsAt + value.durationMinutes * 60000 > data.startsAt;
      });
      const closed = !compatibleOpening(doc.id, data, valid) || blockedByOther;
      if (closed && data.openingClosed !== true) {
        const bookings = await tx.get(doc.ref.collection("bookings").where("status", "==", "confirmed").limit(5));
        if (bookings.size !== data.bookedCount) throw new ManagementError(409, "Le nombre de réservations d’un créneau doit être vérifié dans le planning avant ce changement.");
      }
      if (closed && data.bookedCount > 0) review.conflicts.push({ id: doc.id, startsAt: data.startsAt, bookedCount: data.bookedCount });
      if (closed !== (data.openingClosed === true)) {
        if (closed) review.closing++; else review.reopening++;
        updates.push({ ref: doc.ref, closed });
      }
    }
    const nextPolicy = { version: policy.version + 1, revisions: [...policy.revisions, { version: policy.version + 1, effectiveFrom, opening: valid, updatedAt: now, updatedBy: actor.uid }] };
    if (Buffer.byteLength(JSON.stringify(nextPolicy), "utf8") > 800000) throw new ManagementError(409, "L’historique des horaires doit être archivé avant un nouveau changement.");
    if (save) {
      if (review.conflicts.length) throw new ManagementError(409, "Des réservations occupent les créneaux concernés. Traitez-les avant d’enregistrer ces horaires.");
      for (const update of updates) tx.update(update.ref, { openingClosed: update.closed, updatedAt: now });
      tx.set(openingRef(db, actor.centerId), encodeOpeningPolicy(nextPolicy));
    }
    return { ...review, version: policy.version + (save ? 1 : 0) };
  });
}
