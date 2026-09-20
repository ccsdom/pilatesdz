import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import { AccessError, type Access } from "@/domain/models/access";
import { clientIdSchema } from "@/domain/models/client";
import { bookingCalendarDate } from "@/domain/models/public-booking-calendar";
import { studioDay } from "@/domain/models/planning";
import { studioSlots } from "@/domain/models/studio-slots";
import { publicDayQuery, readSlotOccupancy } from "./public-availability";

/** Materialize only requested days, sharing the public booking identifiers. */
export async function ensureAutomaticSlots(db: Firestore, actor: Access, from: string, to = from, now = Date.now()) {
  if (!/^[a-z0-9-]+$/.test(actor.centerId) || !clientIdSchema.safeParse(actor.uid).success) throw new AccessError(403);
  const first = bookingCalendarDate(from).getTime();
  const last = bookingCalendarDate(to).getTime();
  if (last < first || last - first > 41 * 86400000) throw new Error("Invalid slot range");
  for (let date = first; date <= last; date += 86400000) {
    const day = new Date(date).toISOString().slice(0, 10);
    if (day < studioDay(now)) continue;
    await db.runTransaction(async tx => {
      const root = db.doc(`centers/${actor.centerId}`);
      const member = (await tx.get(root.collection("members").doc(actor.uid))).data();
      if (!member || member.uid !== actor.uid || member.centerId !== actor.centerId || member.role !== actor.role || member.active !== true) throw new AccessError(403);
      if (actor.role === "client") {
        if (!clientIdSchema.safeParse(member.clientId).success) throw new AccessError(403);
        const client = (await tx.get(root.collection("clients").doc(member.clientId))).data();
        if (!client || client.id !== member.clientId || client.centerId !== actor.centerId || client.authUid !== actor.uid || client.status !== "active") throw new AccessError(403);
      }
      const snapshot = await tx.get(publicDayQuery(db, actor.centerId, day));
      if (snapshot.size > 100) throw new Error("Planning needs review");
      const existing = snapshot.docs.map(doc => readSlotOccupancy(doc.id, actor.centerId, doc.data()));
      for (const audience of ["femme", "homme"] as const) {
        for (const slot of studioSlots(day, audience)) {
          if (slot.startsAt <= now || existing.some(item => item.id === slot.id || (item.startsAt < slot.endsAt && item.startsAt + item.durationMinutes * 60000 > slot.startsAt))) continue;
          tx.create(root.collection("sessions").doc(slot.id), { id: slot.id, centerId: actor.centerId, title: `Créneau ${audience === "femme" ? "Femmes" : "Hommes"}`, instructor: "Équipe Studio", startsAt: slot.startsAt, durationMinutes: 60, capacity: 4, bookedCount: 0, status: "scheduled", createdAt: now, createdBy: "automatic_slots" });
        }
      }
    });
  }
}
