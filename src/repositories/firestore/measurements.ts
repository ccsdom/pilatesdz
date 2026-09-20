import "server-only";
import { type Firestore, type Transaction, type DocumentData } from "firebase-admin/firestore";
import { AccessError, type Access } from "@/domain/models/access";
import { clientIdSchema } from "@/domain/models/client";
import { measurementInputSchema, type Measurement } from "@/domain/models/measurements";
import { ManagementError } from "@/domain/ports/access-management";
import type { MeasurementRepository } from "@/domain/ports/measurements";

export function measurementRepository(db: Firestore): MeasurementRepository {
  function refs(actor: Access, clientId: string) {
    if (actor.role !== "admin" || !/^[a-z0-9-]+$/.test(actor.centerId) || !clientIdSchema.safeParse(actor.uid).success || !clientIdSchema.safeParse(clientId).success) throw new AccessError(403);
    const client = db.doc(`centers/${actor.centerId}/clients/${clientId}`);
    return { client, member: db.doc(`centers/${actor.centerId}/members/${actor.uid}`), measurements: client.collection("measurements") };
  }
  async function authorize(tx: Transaction, actor: Access, clientId: string) {
    const ref = refs(actor, clientId);
    const member = (await tx.get(ref.member)).data();
    if (member?.uid !== actor.uid || member.centerId !== actor.centerId || member.role !== "admin" || member.active !== true) throw new AccessError(403);
    const client = (await tx.get(ref.client)).data();
    if (!client || client.id !== clientId || client.centerId !== actor.centerId) throw new ManagementError(404, "Fiche cliente introuvable dans ce centre.");
    return ref;
  }
  function decode(data: DocumentData | undefined, actor: Access, clientId: string, day: string): Measurement {
    const parsed = measurementInputSchema.safeParse({ day: data?.day, values: data?.values });
    if (!data || !parsed.success || data.day !== day || data.centerId !== actor.centerId || data.clientId !== clientId || !Number.isSafeInteger(data.version) || data.version < 1 || !Number.isFinite(data.createdAt) || !Number.isFinite(data.updatedAt) || typeof data.createdBy !== "string" || typeof data.updatedBy !== "string") throw new Error("Invalid measurement record");
    return { ...parsed.data, centerId: actor.centerId, clientId, version: data.version, createdAt: data.createdAt, updatedAt: data.updatedAt, createdBy: data.createdBy, updatedBy: data.updatedBy };
  }
  return {
    list(actor, clientId, after) {
      return db.runTransaction(async tx => {
        const ref = await authorize(tx, actor, clientId);
        let query = ref.measurements.orderBy("day", "desc").limit(26);
        if (after) query = query.startAfter(after);
        const result = await tx.get(query);
        const docs = result.docs.slice(0, 25);
        return { measurements: docs.map(doc => decode(doc.data(), actor, clientId, doc.id)), next: result.size > 25 ? docs.at(-1)!.id : null };
      });
    },
    save(actor, clientId, input, version) {
      return db.runTransaction(async tx => {
        const ref = await authorize(tx, actor, clientId);
        const document = ref.measurements.doc(input.day);
        const snapshot = await tx.get(document);
        const current = snapshot.exists ? decode(snapshot.data(), actor, clientId, input.day) : null;
        if ((current?.version ?? 0) !== version) throw new ManagementError(409, "Un relevé existe déjà à cette date ou a été modifié. Rechargez puis utilisez « Corriger ».");
        const now = Date.now();
        const record: Measurement = { ...input, centerId: actor.centerId, clientId, version: version + 1, createdAt: current?.createdAt ?? now, createdBy: current?.createdBy ?? actor.uid, updatedAt: now, updatedBy: actor.uid };
        // One record per day; revisions remain private and immutable to preserve corrections.
        tx.set(document, record);
        tx.create(document.collection("revisions").doc(String(record.version)), record);
        return record;
      });
    },
  };
}
