import "server-only";
import type { Firestore, Transaction } from "firebase-admin/firestore";
import { AccessError, type Access } from "@/domain/models/access";
import { clientIdSchema } from "@/domain/models/client";
import { attendanceOpen, readAttendance, type AttendanceEvent } from "@/domain/models/attendance";
import { storedSessionSchema } from "@/domain/models/planning";
import { ManagementError } from "@/domain/ports/access-management";
import type { AttendanceRepository } from "@/domain/ports/attendance";

export function attendanceRepository(db: Firestore, now = Date.now): AttendanceRepository {
  async function context(tx: Transaction, actor: Access, id: string, clientId: string) {
    if (actor.role !== "admin" || !/^[a-z0-9-]+$/.test(actor.centerId) || ![actor.uid, id, clientId].every((value) => clientIdSchema.safeParse(value).success)) throw new AccessError(403);
    const root = `centers/${actor.centerId}`;
    const member = (await tx.get(db.doc(`${root}/members/${actor.uid}`))).data();
    if (!member || member.active !== true || member.uid !== actor.uid || member.centerId !== actor.centerId || member.role !== "admin") throw new AccessError(403);
    const sessionRef = db.doc(`${root}/sessions/${id}`);
    const session = (await tx.get(sessionRef)).data();
    if (!session || session.id !== id || session.centerId !== actor.centerId) throw new ManagementError(404, "Séance introuvable dans ce centre.");
    const parsed = storedSessionSchema.safeParse({ title: session.title, instructor: session.instructor, startsAt: session.startsAt, durationMinutes: session.durationMinutes, capacity: session.capacity });
    if (!parsed.success || !["scheduled", "cancelled"].includes(session.status)) throw new Error("Invalid session record");
    const ref = sessionRef.collection("bookings").doc(clientId);
    const booking = (await tx.get(ref)).data();
    if (!booking || booking.clientId !== clientId || booking.sessionId !== id || booking.centerId !== actor.centerId) throw new ManagementError(404, "Réservation introuvable dans ce centre.");
    return { ref, booking, session: { ...parsed.data, status: session.status as string } };
  }
  return {
    async mark(actor, input) {
      return db.runTransaction(async (tx) => {
        const { ref, booking, session } = await context(tx, actor, input.id, input.clientId);
        if (booking.status !== "confirmed" || session.status !== "scheduled") throw new ManagementError(409, "La présence concerne uniquement les réservations confirmées d’une séance non annulée.");
        if (!attendanceOpen(session, now())) throw new ManagementError(409, "La feuille de présence s’ouvre après la fin du cours.");
        const eventRef = ref.collection("attendanceEvents").doc(input.requestId);
        const previous = (await tx.get(eventRef)).data();
        if (previous) {
          if (previous.actorUid !== actor.uid || previous.to !== input.status || previous.reason !== input.reason || previous.version !== input.version + 1) throw new ManagementError(409, "Cette demande a déjà été utilisée pour un autre pointage.");
          return readAttendance(booking.attendance);
        }
        const current = readAttendance(booking.attendance);
        if (current.version !== input.version) throw new ManagementError(409, "La présence a été modifiée entre-temps. Actualisez la séance avant de corriger.");
        if (current.status === input.status) return current;
        if (current.version >= 1000000) throw new ManagementError(409, "Limite de corrections atteinte.");
        const attendance = { status: input.status, version: current.version + 1 };
        const event: AttendanceEvent = { id: input.requestId, from: current.status, to: input.status, version: attendance.version, at: now(), actorUid: actor.uid, reason: input.reason };
        tx.update(ref, { attendance });
        tx.create(eventRef, event);
        return attendance;
      });
    },
    async history(actor, id, clientId, before) {
      return db.runTransaction(async (tx) => {
        const { ref } = await context(tx, actor, id, clientId);
        let query = ref.collection("attendanceEvents").orderBy("version", "desc").limit(21);
        if (before !== undefined) query = query.startAfter(before);
        const result = await tx.get(query);
        const events = result.docs.slice(0, 20).map((doc) => doc.data() as AttendanceEvent);
        return { events, next: result.size > 20 ? events.at(-1)!.version : null };
      });
    },
  };
}
