import "server-only";
import { attendanceOpen, readAttendance, type Attendance } from "@/domain/models/attendance";
import { FieldPath, type DocumentData, type Firestore, type Transaction } from "firebase-admin/firestore";
import { AccessError, type Access } from "@/domain/models/access";
import { clientIdSchema } from "@/domain/models/client";
import { dayRange, storedSessionSchema, type PilatesSession, type BookingStatus } from "@/domain/models/planning";
import { ManagementError } from "@/domain/ports/access-management";
import type { PlanningRepository } from "@/domain/ports/planning";
import { selectPackage } from "@/domain/models/package";
import { decodePackage } from "./packages";

export function planningRepository(db: Firestore, now = Date.now): PlanningRepository {
  function root(actor: Access) {
    if (!/^[a-z0-9-]+$/.test(actor.centerId) || !["admin", "client"].includes(actor.role)) throw new AccessError(403);
    return `centers/${actor.centerId}`;
  }
  function safeId(id: string) { if (!clientIdSchema.safeParse(id).success) throw new ManagementError(400, "Identifiant invalide."); return id; }
  const sessionRef = (actor: Access, id: string) => db.doc(`${root(actor)}/sessions/${safeId(id)}`);
  const profileRef = (actor: Access, id: string) => db.doc(`${root(actor)}/clients/${safeId(id)}`);
  const bookingRef = (actor: Access, id: string, clientId: string) => sessionRef(actor, id).collection("bookings").doc(safeId(clientId));
  async function identity(tx: Transaction, actor: Access, adminOnly = false) {
    const member = (await tx.get(db.doc(`${root(actor)}/members/${safeId(actor.uid)}`))).data();
    if (!member || member.uid !== actor.uid || member.centerId !== actor.centerId || member.role !== actor.role || member.active !== true || (adminOnly && actor.role !== "admin")) throw new AccessError(403);
    if (actor.role === "admin") return { clientId: null, active: true };
    if (typeof member.clientId !== "string") throw new ManagementError(409, "Votre fiche doit être reliée à votre accès par le centre.");
    const profile = (await tx.get(profileRef(actor, member.clientId))).data();
    if (!profile || profile.id !== member.clientId || profile.centerId !== actor.centerId || profile.authUid !== actor.uid || !["active", "inactive"].includes(profile.status)) throw new AccessError(403);
    return { clientId: member.clientId as string, active: profile.status === "active" };
  }
  function decode(actor: Access, id: string, data?: DocumentData): PilatesSession {
    if (!data) throw new ManagementError(404, "Séance introuvable dans ce centre.");
    const parsed = storedSessionSchema.safeParse({ title: data.title, instructor: data.instructor, startsAt: data.startsAt, durationMinutes: data.durationMinutes, capacity: data.capacity });
    if (!parsed.success || data.id !== id || data.centerId !== actor.centerId || !["scheduled", "cancelled"].includes(data.status) || !Number.isInteger(data.bookedCount) || data.bookedCount < 0 || data.bookedCount > data.capacity) throw new Error("Invalid session record");
    return { ...parsed.data, id, centerId: actor.centerId, status: data.status, bookedCount: data.bookedCount };
  }
  function bookingStatus(session: PilatesSession, clientId: string, data?: DocumentData): BookingStatus {
    if (!data) return "none";
    if (data.clientId !== clientId || data.sessionId !== session.id || data.centerId !== session.centerId || !["confirmed", "cancelled"].includes(data.status)) throw new Error("Invalid booking record");
    return session.status === "cancelled" && data.status === "confirmed" ? "session-cancelled" : data.status;
  }
  function future(session: PilatesSession) { if (session.startsAt <= now()) throw new ManagementError(409, "Cette séance a déjà commencé."); }
  async function prepareRefund(tx: Transaction, actor: Access, sessionId: string, clientId: string, booking: DocumentData) {
    // Older demonstration bookings never consumed a credit and must not create one.
    if (!booking.creditPackageId || booking.creditRefunded === true) return () => {};
    const ref = profileRef(actor, clientId).collection("packages").doc(safeId(booking.creditPackageId));
    const pack = decodePackage(actor.centerId, clientId, ref.id, (await tx.get(ref)).data());
    if (pack.remaining >= pack.credits || !Number.isSafeInteger(booking.creditRevision) || booking.creditRevision < 1) throw new Error("Invalid credit refund");
    return () => {
      tx.update(ref, { remaining: pack.remaining + 1 });
      tx.create(ref.collection("movements").doc(`${sessionId}_${booking.creditRevision}_refund`), { delta: 1, reason: "cancellation", sessionId, at: now(), actorUid: actor.uid });
    };
  }
  return {
    async pendingAttendance(actor, from, to) {
      const at = now();
      return db.runTransaction(async tx => {
        await identity(tx, actor, true);
        const snapshot = await tx.get(db.collection(`${root(actor)}/sessions`)
          .where("startsAt", ">=", dayRange(from).start).where("startsAt", "<", dayRange(to).end)
          .orderBy("startsAt").orderBy(FieldPath.documentId()).limit(501));
        if (snapshot.size > 500) throw new ManagementError(409, "Plus de 500 séances sur cette période. Réduisez les dates pour obtenir un suivi complet.");
        const ended = snapshot.docs.map(doc => decode(actor, doc.id, doc.data())).filter(session => attendanceOpen(session, at));
        const rows = await Promise.all(ended.map(async session => {
          const bookings = await tx.get(sessionRef(actor, session.id).collection("bookings").where("status", "==", "confirmed").limit(31));
          if (bookings.size > session.capacity) throw new Error("Invalid occupancy");
          const pending = bookings.docs.filter(doc => {
            bookingStatus(session, doc.id, doc.data());
            return readAttendance(doc.data().attendance).status === "unmarked";
          }).length;
          return { session, pending, total: bookings.size };
        }));
        const sessions = rows.filter(row => row.pending > 0);
        return { from, to, pending: sessions.reduce((sum, row) => sum + row.pending, 0), sessions };
      });
    },
    async daySessions(actor, day) {
      return db.runTransaction(async tx => {
        await identity(tx, actor, true);
        const range = dayRange(day);
        const snapshot = await tx.get(db.collection(`${root(actor)}/sessions`)
          .where("startsAt", ">=", range.start).where("startsAt", "<", range.end)
          .orderBy("startsAt").orderBy(FieldPath.documentId()).limit(501));
        if (snapshot.size > 500) throw new ManagementError(409, "Le tableau de bord ne peut pas résumer plus de 500 séances par jour. Consultez le planning.");
        return snapshot.docs.map(doc => decode(actor, doc.id, doc.data()));
      });
    },
    async create(actor, id, input) {
      return db.runTransaction(async (tx) => {
        await identity(tx, actor, true);
        const ref = sessionRef(actor, id);
        const existing = await tx.get(ref);
        if (existing.exists) {
          const session = decode(actor, id, existing.data());
          if (existing.data()?.createdBy !== actor.uid || Object.entries(input).some(([key, value]) => existing.data()?.[key] !== value)) throw new ManagementError(409, "Cette demande correspond déjà à une autre séance.");
          return session;
        }
        if (input.startsAt <= now() || input.startsAt > now() + 366 * 86400000) throw new ManagementError(400, "La séance doit commencer dans le futur, au cours des douze prochains mois.");
        const session: PilatesSession = { ...input, id, centerId: actor.centerId, status: "scheduled", bookedCount: 0 };
        tx.create(ref, { ...session, createdAt: now(), createdBy: actor.uid });
        return session;
      });
    },
    async list(actor, day, after) {
      return db.runTransaction(async (tx) => {
        const person = await identity(tx, actor);
        const range = dayRange(day);
        let query = db.collection(`${root(actor)}/sessions`).where("startsAt", ">=", range.start).where("startsAt", "<", range.end).orderBy("startsAt").orderBy(FieldPath.documentId()).limit(51);
        if (after) { const split = after.indexOf("_"); query = query.startAfter(Number(after.slice(0, split)), safeId(after.slice(split + 1))); }
        const snapshot = await tx.get(query);
        const sessions = [];
        for (const doc of snapshot.docs.slice(0, 50)) {
          const session = decode(actor, doc.id, doc.data());
          const myBooking = person.clientId ? bookingStatus(session, person.clientId, (await tx.get(bookingRef(actor, doc.id, person.clientId))).data()) : "none";
          sessions.push({ session, myBooking });
        }
        const last = sessions.at(-1)?.session;
        return { sessions, day, next: snapshot.size > 50 && last ? `${last.startsAt}_${last.id}` : null };
      });
    },
    async get(actor, id) {
      return db.runTransaction(async (tx) => {
        const person = await identity(tx, actor);
        const session = decode(actor, id, (await tx.get(sessionRef(actor, id))).data());
        const myBooking = person.clientId ? bookingStatus(session, person.clientId, (await tx.get(bookingRef(actor, id, person.clientId))).data()) : "none";
        const attendees: { clientId: string; name: string; attendance: Attendance }[] = [];
        if (actor.role === "admin") {
          const bookings = await tx.get(sessionRef(actor, id).collection("bookings").where("status", "==", "confirmed").limit(31));
          if (bookings.size > session.capacity) throw new Error("Invalid occupancy");
          for (const doc of bookings.docs) {
            bookingStatus(session, doc.id, doc.data());
            const profile = (await tx.get(profileRef(actor, doc.id))).data();
            if (!profile || profile.id !== doc.id || profile.centerId !== actor.centerId || typeof profile.name !== "string") throw new Error("Invalid attendee");
            attendees.push({ clientId: doc.id, name: profile.name, attendance: readAttendance(doc.data().attendance) });
          }
        }
        return { session, myBooking, attendees };
      });
    },
    async book(actor, id, targetClientId) {
      await db.runTransaction(async (tx) => {
        const person = await identity(tx, actor);
        if (actor.role === "admin") {
          if (!targetClientId) throw new AccessError(403);
          const profile = (await tx.get(profileRef(actor, targetClientId))).data();
          if (!profile) throw new ManagementError(404, "Cliente introuvable dans ce centre.");
          if (profile.id !== targetClientId || profile.centerId !== actor.centerId) throw new AccessError(403);
          if (profile.status !== "active") throw new ManagementError(409, "La fiche de cette cliente est inactive.");
          person.clientId = targetClientId;
        } else if (targetClientId !== undefined) throw new AccessError(403);
        if (!person.clientId || !person.active) throw new AccessError(403);
        const ref = sessionRef(actor, id);
        const session = decode(actor, id, (await tx.get(ref)).data());
        future(session);
        if (session.status !== "scheduled") throw new ManagementError(409, "Cette séance est annulée.");
        const booking = bookingRef(actor, id, person.clientId);
        const previous = (await tx.get(booking)).data();
        const status = bookingStatus(session, person.clientId, previous);
        if (status === "confirmed") return; // Retrying a confirmed reservation never consumes another place.
        if (session.bookedCount >= session.capacity) throw new ManagementError(409, "Cette séance est complète.");
        const available = await tx.get(profileRef(actor, person.clientId).collection("packages").where("expiresAt", ">", session.startsAt).orderBy("expiresAt").limit(101));
        if (available.size > 100) throw new ManagementError(409, "Le centre doit vérifier vos forfaits avant cette réservation.");
        const pack = selectPackage(available.docs.map((doc) => decodePackage(actor.centerId, person.clientId!, doc.id, doc.data())), session.startsAt);
        if (!pack) throw new ManagementError(409, "Aucun crédit disponible dans un forfait valable à la date de cette séance. Contactez le centre.");
        const creditRevision = (previous?.creditRevision ?? 0) + 1;
        if (!Number.isSafeInteger(creditRevision) || creditRevision < 1) throw new Error("Invalid booking revision");
        const creditRef = profileRef(actor, person.clientId).collection("packages").doc(pack.id);
        tx.update(creditRef, { remaining: pack.remaining - 1 });
        tx.create(creditRef.collection("movements").doc(`${id}_${creditRevision}_debit`), { delta: -1, reason: "booking", sessionId: id, at: now(), actorUid: actor.uid });
        tx.set(booking, { sessionId: id, centerId: actor.centerId, clientId: person.clientId, status: "confirmed", bookedAt: now(), updatedAt: now(), updatedBy: actor.uid, creditPackageId: pack.id, creditRevision, creditRefunded: false });
        tx.update(ref, { bookedCount: session.bookedCount + 1 });
      });
    },
    async cancelBooking(actor, id, targetClientId) {
      await db.runTransaction(async (tx) => {
        const person = await identity(tx, actor);
        if (targetClientId && actor.role !== "admin") throw new AccessError(403);
        const clientId = actor.role === "admin" ? targetClientId : person.clientId;
        if (!clientId) throw new ManagementError(400, "Cliente requise.");
        const ref = sessionRef(actor, id);
        const session = decode(actor, id, (await tx.get(ref)).data());
        const booking = bookingRef(actor, id, clientId);
        const previous = (await tx.get(booking)).data();
        const status = bookingStatus(session, clientId, previous);
        if (status === "none" || status === "cancelled" || status === "session-cancelled") return;
        future(session);
        if (session.bookedCount < 1) throw new Error("Invalid occupancy");
        const refund = await prepareRefund(tx, actor, id, clientId, previous!);
        refund();
        tx.update(booking, { status: "cancelled", updatedAt: now(), updatedBy: actor.uid, creditRefunded: true });
        tx.update(ref, { bookedCount: session.bookedCount - 1 });
      });
    },
    async cancelSession(actor, id) {
      await db.runTransaction(async (tx) => {
        await identity(tx, actor, true);
        const ref = sessionRef(actor, id);
        const session = decode(actor, id, (await tx.get(ref)).data());
        if (session.status === "cancelled") return;
        future(session);
        const bookings = await tx.get(ref.collection("bookings").where("status", "==", "confirmed").limit(31));
        if (bookings.size > 30 || bookings.size !== session.bookedCount) throw new Error("Invalid occupancy");
        const refunds = [];
        for (const doc of bookings.docs) {
          bookingStatus(session, doc.id, doc.data());
          refunds.push(await prepareRefund(tx, actor, id, doc.id, doc.data()));
        }
        // Read every package before any write; capacity bounds this atomic refund to 30 clients.
        refunds.forEach((refund) => refund());
        bookings.docs.forEach((doc) => tx.update(doc.ref, { creditRefunded: true, updatedAt: now(), updatedBy: actor.uid }));
        tx.update(ref, { status: "cancelled", bookedCount: 0, cancelledAt: now(), cancelledBy: actor.uid });
      });
    },
  };
}
