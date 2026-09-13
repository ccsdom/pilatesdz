import "server-only";
import { FieldPath, type Firestore } from "firebase-admin/firestore";
import { AccessError } from "@/domain/models/access";
import { clientIdSchema } from "@/domain/models/client";
import { readAttendance } from "@/domain/models/attendance";
import { storedSessionSchema } from "@/domain/models/planning";
import { monthRange, historyStatus, historySummary, type HistoryEntry } from "@/domain/models/client-history";
import { ManagementError } from "@/domain/ports/access-management";
import type { ClientHistoryRepository } from "@/domain/ports/client-history";

export function clientHistoryRepository(db: Firestore, now = Date.now): ClientHistoryRepository {
  return { async list(actor, month, requestedClientId, after) {
    return db.runTransaction(async (tx) => {
      if (!/^[a-z0-9-]+$/.test(actor.centerId) || !clientIdSchema.safeParse(actor.uid).success || !["admin", "client"].includes(actor.role)) throw new AccessError(403);
      const root = `centers/${actor.centerId}`;
      const member = (await tx.get(db.doc(`${root}/members/${actor.uid}`))).data();
      if (!member || member.uid !== actor.uid || member.centerId !== actor.centerId || member.role !== actor.role || member.active !== true) throw new AccessError(403);
      if (actor.role === "client" && requestedClientId) throw new AccessError(403);
      const clientId = actor.role === "admin" ? requestedClientId : member.clientId;
      if (typeof clientId !== "string" || !clientIdSchema.safeParse(clientId).success) throw new ManagementError(409, "Votre accès doit être relié à une fiche cliente.");
      const profile = (await tx.get(db.doc(`${root}/clients/${clientId}`))).data();
      if (!profile || profile.id !== clientId || profile.centerId !== actor.centerId) throw new ManagementError(404, "Cliente introuvable dans ce centre.");
      if (actor.role === "client" && profile.authUid !== actor.uid) throw new AccessError(403);
      const range = monthRange(month);
      const sessions = await tx.get(db.collection(`${root}/sessions`).where("startsAt", ">=", range.start).where("startsAt", "<", range.end).orderBy("startsAt", "desc").orderBy(FieldPath.documentId()).limit(501));
      // Never present statistics calculated from a silently truncated month.
      if (sessions.size > 500) throw new ManagementError(409, "Ce mois dépasse 500 séances. L’historique nécessite une adaptation avant d’afficher des indicateurs complets.");
      const bookings = sessions.empty ? [] : await tx.getAll(...sessions.docs.map((doc) => doc.ref.collection("bookings").doc(clientId)));
      const entries: HistoryEntry[] = [];
      const timestamp = now();
      for (let index = 0; index < sessions.docs.length; index++) {
        const booking = bookings[index]?.data();
        if (!booking) continue;
        const doc = sessions.docs[index], data = doc.data();
        if (booking.clientId !== clientId || booking.centerId !== actor.centerId || booking.sessionId !== doc.id || !["confirmed", "cancelled"].includes(booking.status)) throw new Error("Invalid history booking");
        const parsed = storedSessionSchema.safeParse({ title: data.title, instructor: data.instructor, startsAt: data.startsAt, durationMinutes: data.durationMinutes, capacity: data.capacity });
        if (!parsed.success || data.id !== doc.id || data.centerId !== actor.centerId || !["scheduled", "cancelled"].includes(data.status)) throw new Error("Invalid history session");
        const session = { ...parsed.data, status: data.status as string };
        entries.push({ id: doc.id, title: session.title, instructor: session.instructor, startsAt: session.startsAt, durationMinutes: session.durationMinutes, status: historyStatus(session, { status: booking.status, attendance: readAttendance(booking.attendance).status }, timestamp) });
      }
      const offset = after ? entries.findIndex((entry) => `${entry.startsAt}_${entry.id}` === after) : -1;
      if (after && offset < 0) throw new ManagementError(400, "Cette page a changé. Revenez au début du mois.");
      const page = entries.slice(offset + 1, offset + 21);
      const last = page.at(-1);
      return { month, entries: page, summary: historySummary(entries), next: offset + 21 < entries.length && last ? `${last.startsAt}_${last.id}` : null };
    });
  } };
}
