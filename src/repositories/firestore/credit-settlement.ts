import { isCenterOperator } from "@/domain/models/access";
import "server-only";
import { randomUUID } from "node:crypto";
import type { Firestore, Transaction } from "firebase-admin/firestore";
import { AccessError, type Access } from "@/domain/models/access";
import { clientIdSchema } from "@/domain/models/client";
import { creditStatus, creditTransition, settlementInput, type SettlementInput } from "@/domain/models/credit-settlement";
import { ManagementError } from "@/domain/ports/access-management";
import { storedSessionSchema } from "@/domain/models/planning";
import { decodePackage } from "./packages";

export function settlementRepository(db: Firestore, now = Date.now) {
  function root(centerId: string) {
    if (!/^[a-z0-9-]+$/.test(centerId)) throw new AccessError(403);
    return db.doc(`centers/${centerId}`);
  }
  async function admin(tx: Transaction, actor: Access) {
    if (!isCenterOperator(actor.role) || !clientIdSchema.safeParse(actor.uid).success) throw new AccessError(403);
    const member = (await tx.get(root(actor.centerId).collection("members").doc(actor.uid))).data();
    if (!member || member.uid !== actor.uid || member.centerId !== actor.centerId || member.role !== actor.role || !isCenterOperator(member.role) || member.active !== true) throw new AccessError(403);
  }
  function policy(data: FirebaseFirestore.DocumentData | undefined) {
    const mode = data?.mode ?? "manual", version = data?.version ?? 0;
    if (!["manual", "automatic"].includes(mode) || !Number.isSafeInteger(version) || version < 0) throw new Error("Invalid credit policy");
    return { mode: mode as "manual" | "automatic", version };
  }
  async function settle(centerId: string, value: SettlementInput, actor?: Access) {
    const input = settlementInput.parse(value);
    return db.runTransaction(async tx => {
      if (actor) { if (actor.centerId !== centerId) throw new AccessError(403); await admin(tx, actor); }
      const center = root(centerId);
      const sessionRef = center.collection("sessions").doc(input.id);
      const session = (await tx.get(sessionRef)).data();
      if (!session || session.id !== input.id || session.centerId !== centerId) throw new ManagementError(404, "Créneau introuvable.");
      const parsed = storedSessionSchema.parse({ title: session.title, instructor: session.instructor, startsAt: session.startsAt, durationMinutes: session.durationMinutes, capacity: session.capacity });
      const ref = sessionRef.collection("bookings").doc(input.clientId);
      const booking = (await tx.get(ref)).data();
      if (!booking || booking.sessionId !== input.id || booking.clientId !== input.clientId || booking.centerId !== centerId) throw new ManagementError(404, "Réservation introuvable.");
      const state = creditStatus(booking);
      if (!state) throw new ManagementError(409, "Cette réservation n’utilise pas de crédit de forfait.");
      const eventRef = ref.collection("creditDecisions").doc(input.requestId);
      const previous = (await tx.get(eventRef)).data();
      const actorUid = actor?.uid ?? "automatic_settlement";
      if (previous) {
        if (previous.actorUid !== actorUid || previous.to !== input.state || previous.reason !== input.reason || previous.version !== input.version + 1) throw new ManagementError(409, "Demande déjà utilisée pour une autre décision.");
        return state;
      }
      const jobRef = center.collection("automaticCreditJobs").doc(`${input.id}_${input.clientId}`);
      if (!actor && (state.state !== "reserved" || booking.settlementMode !== "automatic" || booking.status !== "confirmed" || session.status !== "scheduled")) { tx.delete(jobRef); return state; }
      if (booking.status !== "confirmed" || session.status !== "scheduled") throw new ManagementError(409, "Cette réservation est annulée.");
      if (now() < parsed.startsAt + parsed.durationMinutes * 60000) throw new ManagementError(409, "Attendez la fin du créneau pour valider sa consommation.");
      if (state.version !== input.version || state.version >= 1000000) throw new ManagementError(409, "La décision a changé. Actualisez le créneau.");
      if (state.state === input.state) { tx.delete(jobRef); return state; }
      const packRef = center.collection("clients").doc(input.clientId).collection("packages").doc(booking.creditPackageId);
      const pack = decodePackage(centerId, input.clientId, packRef.id, (await tx.get(packRef)).data());
      const balance = creditTransition(pack, state.state, input.state);
      const version = state.version + 1;
      tx.update(packRef, { remaining: balance.remaining, reserved: balance.reserved });
      tx.update(ref, { creditState: input.state, creditRefunded: input.state === "refunded", creditDecisionVersion: version, creditDecidedAt: now(), creditDecidedBy: actorUid });
      tx.create(eventRef, { from: state.state, to: input.state, reason: input.reason, actorUid, at: now(), version });
      tx.create(packRef.collection("movements").doc(`decision_${input.requestId}`), { delta: balance.remaining - pack.remaining, reservedDelta: balance.reserved - (pack.reserved ?? 0), reason: "settlement", sessionId: input.id, at: now(), actorUid });
      tx.delete(jobRef);
      tx.delete(center.collection("pendingCreditDecisions").doc(`${input.id}_${input.clientId}`));
      return { state: input.state, version, legacy: false };
    });
  }
  return {
    async pending(actor: Access) {
      return db.runTransaction(async tx => {
        await admin(tx, actor);
        const center = root(actor.centerId);
        const result = await tx.get(center.collection("pendingCreditDecisions").where("endsAt", "<=", now()).orderBy("endsAt").limit(51));
        const items = [];
        for (const doc of result.docs.slice(0, 50)) {
          const record = doc.data();
          if (!clientIdSchema.safeParse(record.clientId).success || !clientIdSchema.safeParse(record.sessionId).success) throw new Error("Invalid pending decision");
          const profile = (await tx.get(center.collection("clients").doc(record.clientId))).data();
          if (!profile || profile.id !== record.clientId || profile.centerId !== actor.centerId) throw new Error("Invalid pending client");
          items.push({ id: doc.id, sessionId: record.sessionId as string, clientId: record.clientId as string, name: String(profile.name), endsAt: Number(record.endsAt) });
        }
        return { items, more: result.size > 50 };
      });
    },
    async settings(actor: Access) {
      return db.runTransaction(async tx => {
        await admin(tx, actor);
        const center = root(actor.centerId);
        const settings = policy((await tx.get(center.collection("settings").doc("credits"))).data());
        const worker = (await tx.get(center.collection("settings").doc("creditWorker"))).data();
        return { ...settings, automationReady: typeof worker?.lastSuccessAt === "number" && worker.lastSuccessAt <= now() && now() - worker.lastSuccessAt < 15 * 60000 };
      });
    },
    async setMode(actor: Access, mode: "manual" | "automatic", expectedVersion: number) {
      if (!["manual", "automatic"].includes(mode) || !Number.isSafeInteger(expectedVersion) || expectedVersion < 0) throw new ManagementError(400, "Réglage invalide.");
      return db.runTransaction(async tx => {
        await admin(tx, actor);
        const center = root(actor.centerId), ref = center.collection("settings").doc("credits");
        const current = policy((await tx.get(ref)).data());
        if (current.version !== expectedVersion) throw new ManagementError(409, "Le réglage a changé. Actualisez la page.");
        if (mode === "automatic") {
          const worker = (await tx.get(center.collection("settings").doc("creditWorker"))).data();
          if (typeof worker?.lastSuccessAt !== "number" || worker.lastSuccessAt > now() || now() - worker.lastSuccessAt >= 15 * 60000) throw new ManagementError(409, "Le traitement automatique doit être actif avant de choisir ce mode.");
        }
        const result = { mode, version: current.version + 1 };
        tx.set(ref, { ...result, updatedAt: now(), updatedBy: actor.uid });
        tx.create(ref.collection("changes").doc(String(result.version)), { ...result, previousMode: current.mode, at: now(), actorUid: actor.uid });
        return result;
      });
    },
    decide: (actor: Access, input: SettlementInput) => settle(actor.centerId, input, actor),
    async runAutomatic(centerId: string) {
      const center = root(centerId);
      const started = Date.now();
      const jobs = await center.collection("automaticCreditJobs").where("dueAt", "<=", now()).orderBy("dueAt").limit(20).get();
      let processed = 0, failed = 0;
      for (const doc of jobs.docs) {
        if (Date.now() - started > 40000) break;
        const job = doc.data();
        try {
          await settle(centerId, { id: job.sessionId, clientId: job.clientId, requestId: randomUUID(), version: 0, state: "consumed", reason: "Validation automatique après la fin du créneau" });
          processed++;
        } catch {
          failed++;
          // Back off only if still queued; a simultaneous manual decision must
          // not be undone or recreate its removed job.
          await db.runTransaction(async tx => {
            if ((await tx.get(doc.ref)).exists) tx.update(doc.ref, { dueAt: now() + 3600000, lastErrorAt: now() });
          });
        }
      }
      await center.collection("settings").doc("creditWorker").set({ lastSuccessAt: now(), processed, failed });
      return { processed, failed };
    },
  };
}
