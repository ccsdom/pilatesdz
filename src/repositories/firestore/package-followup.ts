import { isCenterOperator } from "@/domain/models/access";
import "server-only";
import { FieldPath, type Firestore } from "firebase-admin/firestore";
import { AccessError } from "@/domain/models/access";
import { clientIdSchema } from "@/domain/models/client";
import { summarizePackages } from "@/domain/models/package-followup";
import { ManagementError } from "@/domain/ports/access-management";
import type { PackageFollowupRepository } from "@/domain/ports/package-followup";
import { decodePackage } from "./packages";
import { storedSubscription } from "./subscriptions";

export function packageFollowupRepository(db: Firestore, now = Date.now): PackageFollowupRepository {
  return { async list(actor, after) {
    const at = now();
    return db.runTransaction(async tx => {
      if (!isCenterOperator(actor.role) || !/^[a-z0-9-]+$/.test(actor.centerId) || !clientIdSchema.safeParse(actor.uid).success) throw new AccessError(403);
      const root = `centers/${actor.centerId}`;
      const member = (await tx.get(db.doc(`${root}/members/${actor.uid}`))).data();
      if (!member || member.uid !== actor.uid || member.centerId !== actor.centerId || member.role !== actor.role || !isCenterOperator(member.role) || member.active !== true) throw new AccessError(403);
      let query = db.collection(`${root}/clients`).orderBy(FieldPath.documentId()).limit(26);
      if (after !== undefined) {
        if (!clientIdSchema.safeParse(after).success) throw new AccessError(403);
        query = query.startAfter(after);
      }
      const page = await tx.get(query), docs = page.docs.slice(0, 25);
      const rows = await Promise.all(docs.map(async doc => {
        const profile = doc.data();
        if (profile.id !== doc.id || profile.centerId !== actor.centerId || typeof profile.name !== "string" || !["active", "inactive"].includes(profile.status)) throw new Error("Invalid client profile");
        if (profile.status !== "active") return null;
        const snapshot = await tx.get(doc.ref.collection("packages").where("expiresAt", ">", at).limit(101));
        if (snapshot.size > 100) throw new ManagementError(409, "Plus de 100 forfaits non expirés pour une cliente. Vérifiez sa fiche avant de poursuivre le suivi.");
        const packages = snapshot.docs.map(p => {
          const data = p.data(), pack = decodePackage(actor.centerId, doc.id, p.id, data);
          if (data.subscriptionId !== undefined && !clientIdSchema.safeParse(data.subscriptionId).success) throw new Error("Invalid subscription reference");
          return { ...pack, subscriptionId: data.subscriptionId as string | undefined };
        });
        const ends: Record<string, number> = {};
        for (const id of new Set(packages.flatMap(p => p.subscriptionId ? [p.subscriptionId] : []))) {
          const record = storedSubscription.parse((await tx.get(doc.ref.collection("subscriptions").doc(id))).data());
          if (record.id !== id || record.clientId !== doc.id || record.centerId !== actor.centerId) throw new Error("Invalid subscription ownership");
          if (packages.some(pack => pack.subscriptionId === id && !record.periods.some(period => period.validFrom === pack.validFrom && period.expiresAt === pack.expiresAt && period.credits === pack.credits))) throw new Error("Invalid subscription package period");
          ends[id] = record.periods.at(-1)!.expiresAt;
        }
        return { clientId: doc.id, name: profile.name, ...summarizePackages(packages, ends, at) };
      }));
      return { at, scanned: docs.length, rows: rows.filter((row): row is NonNullable<typeof row> => row !== null && (row.low || row.endings.length > 0)), next: page.size > 25 ? docs.at(-1)!.id : null };
    });
  } };
}
