import { isCenterOperator } from "@/domain/models/access";
import "server-only";
import { FieldPath, type DocumentData, type Firestore } from "firebase-admin/firestore";
import { AccessError } from "@/domain/models/access";
import { clientIdSchema } from "@/domain/models/client";
import { packageInputSchema, type CreditPackage } from "@/domain/models/package";
import { ManagementError } from "@/domain/ports/access-management";
import type { PackageRepository } from "@/domain/ports/packages";

export function decodePackage(centerId: string, clientId: string, id: string, data?: DocumentData): CreditPackage {
  if (!data) throw new Error("Missing credit package");
  const parsed = packageInputSchema.safeParse({ label: data.label, credits: data.credits, validFrom: data.validFrom, expiresAt: data.expiresAt });
  if (!parsed.success || data.id !== id || data.centerId !== centerId || data.clientId !== clientId || !Number.isSafeInteger(data.remaining) || data.remaining < 0 || data.remaining > data.credits || !Number.isSafeInteger(data.assignedAt)) throw new Error("Invalid credit package");
  const reserved = data.reserved ?? 0;
  if (!Number.isSafeInteger(reserved) || reserved < 0 || reserved + data.remaining > data.credits) throw new Error("Invalid reserved credits");
  return { ...parsed.data, id, centerId, clientId, remaining: data.remaining, reserved, assignedAt: data.assignedAt };
}
export function packagesRepository(db: Firestore, now = Date.now): PackageRepository {
  return {
    async assign(actor, clientId, id, input) {
      return db.runTransaction(async (tx) => {
        if (!isCenterOperator(actor.role) || !/^[a-z0-9-]+$/.test(actor.centerId) || !clientIdSchema.safeParse(clientId).success || !clientIdSchema.safeParse(id).success) throw new AccessError(403);
        const root = `centers/${actor.centerId}`;
        const member = (await tx.get(db.doc(`${root}/members/${actor.uid}`))).data();
        if (!member || member.uid !== actor.uid || member.centerId !== actor.centerId || member.role !== actor.role || !isCenterOperator(member.role) || member.active !== true) throw new AccessError(403);
        const profile = db.doc(`${root}/clients/${clientId}`);
        const data = (await tx.get(profile)).data();
        if (!data || data.id !== clientId || data.centerId !== actor.centerId) throw new ManagementError(404, "Cliente introuvable dans ce centre.");
        const ref = profile.collection("packages").doc(id);
        const existing = await tx.get(ref);
        if (existing.exists) {
          if (existing.data()?.assignedBy !== actor.uid || Object.entries(input).some(([key, value]) => existing.data()?.[key] !== value)) throw new ManagementError(409, "Cette demande a déjà attribué un autre forfait.");
          return decodePackage(actor.centerId, clientId, id, existing.data());
        }
        if (data.status !== "active") throw new ManagementError(409, "Réactivez la fiche avant d’attribuer un forfait.");
        if (input.expiresAt <= now() || input.validFrom > now() + 366 * 86400000) throw new ManagementError(400, "Choisissez une validité actuelle ou débutant dans les douze prochains mois.");
        // Reading the profile serializes concurrent assignments against this bound.
        const unexpired = await tx.get(profile.collection("packages").where("expiresAt", ">", now()).limit(100));
        if (unexpired.size >= 100) throw new ManagementError(409, "Limite de 100 forfaits non expirés par cliente atteinte.");
        const pack: CreditPackage = { ...input, id, centerId: actor.centerId, clientId, remaining: input.credits, assignedAt: now() };
        tx.create(ref, { ...pack, assignedBy: actor.uid });
        tx.create(ref.collection("movements").doc("assignment"), { delta: input.credits, reason: "assignment", at: now(), actorUid: actor.uid });
        tx.update(profile, { lastPackageAssignedAt: now() });
        return pack;
      });
    },
    async list(actor, requestedClientId, after) {
      return db.runTransaction(async (tx) => {
        if (!/^[a-z0-9-]+$/.test(actor.centerId)) throw new AccessError(403);
        const root = `centers/${actor.centerId}`;
        const member = (await tx.get(db.doc(`${root}/members/${actor.uid}`))).data();
        if (!member || member.uid !== actor.uid || member.centerId !== actor.centerId || member.active !== true || member.role !== actor.role) throw new AccessError(403);
        if (actor.role === "client" && requestedClientId) throw new AccessError(403);
        const clientId = isCenterOperator(actor.role) ? requestedClientId : member.clientId;
        if (typeof clientId !== "string" || !clientIdSchema.safeParse(clientId).success) throw new ManagementError(400, "Fiche cliente requise.");
        const profile = db.doc(`${root}/clients/${clientId}`);
        const data = (await tx.get(profile)).data();
        if (!data || data.id !== clientId || data.centerId !== actor.centerId) throw new ManagementError(404, "Cliente introuvable.");
        if (actor.role === "client" && data.authUid !== actor.uid) throw new AccessError(403);
        let query = profile.collection("packages").orderBy("assignedAt", "desc").orderBy(FieldPath.documentId()).limit(21);
        if (after) { const split = after.indexOf("_"); query = query.startAfter(Number(after.slice(0, split)), after.slice(split + 1)); }
        const snapshot = await tx.get(query);
        const packages = snapshot.docs.slice(0, 20).map((doc) => decodePackage(actor.centerId, clientId, doc.id, doc.data()));
        const last = packages.at(-1);
        return { packages, clientId, next: snapshot.size > 20 && last ? `${last.assignedAt}_${last.id}` : null };
      });
    },
  };
}
