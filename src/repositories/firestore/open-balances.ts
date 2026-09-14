import "server-only";
import { FieldPath, type Firestore } from "firebase-admin/firestore";
import { z } from "zod";
import { AccessError } from "@/domain/models/access";
import { clientIdSchema } from "@/domain/models/client";
import { subscriptionBalance } from "@/domain/models/open-balances";
import { ManagementError } from "@/domain/ports/access-management";
import type { OpenBalanceRepository } from "@/domain/ports/open-balances";
import { storedSubscription } from "./subscriptions";

export function openBalanceRepository(db: Firestore): OpenBalanceRepository {
  return { async list(actor, after) {
    return db.runTransaction(async tx => {
      if (actor.role !== "admin" || !/^[a-z0-9-]+$/.test(actor.centerId) || !clientIdSchema.safeParse(actor.uid).success) throw new AccessError(403);
      const root = `centers/${actor.centerId}`;
      const member = (await tx.get(db.doc(`${root}/members/${actor.uid}`))).data();
      if (!member || member.uid !== actor.uid || member.centerId !== actor.centerId || member.role !== "admin" || member.active !== true) throw new AccessError(403);
      let query = db.collection(`${root}/clients`).orderBy(FieldPath.documentId()).limit(26);
      if (after !== undefined) {
        if (!clientIdSchema.safeParse(after).success) throw new AccessError(403);
        query = query.startAfter(after);
      }
      const page = await tx.get(query), clients = page.docs.slice(0, 25);
      const groups = await Promise.all(clients.map(async client => {
        const profile = client.data();
        if (profile.id !== client.id || profile.centerId !== actor.centerId || typeof profile.name !== "string" || !["active", "inactive"].includes(profile.status)) throw new Error("Invalid client profile");
        const snapshot = await tx.get(client.ref.collection("subscriptions").orderBy(FieldPath.documentId()).limit(101));
        if (snapshot.size > 100) throw new ManagementError(409, "Plus de 100 abonnements pour une cliente. Consultez ses journaux individuels ; aucun total partiel n’est présenté.");
        return snapshot.docs.map(doc => {
          const data = doc.data(), record = storedSubscription.parse(data);
          if (!z.string().uuid().safeParse(doc.id).success || record.id !== doc.id || record.clientId !== client.id || record.centerId !== actor.centerId) throw new Error("Invalid subscription identity");
          return { clientId: client.id, name: profile.name, active: profile.status === "active", subscriptionId: doc.id,
            purchaseDate: record.purchaseDate, offerId: record.offerId, term: record.term,
            ...subscriptionBalance(record.amountDzd, data.paidMinor, data.paymentRecorded) };
        }).filter(row => row.remainingMinor > 0);
      }));
      const rows = groups.flat().sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate) || a.clientId.localeCompare(b.clientId) || a.subscriptionId.localeCompare(b.subscriptionId));
      const remainingMinor = rows.reduce((sum, row) => sum + row.remainingMinor, 0);
      if (!Number.isSafeInteger(remainingMinor)) throw new Error("Balance summary exceeds safe precision");
      return { scanned: clients.length, rows, remainingMinor, next: page.size > 25 ? clients.at(-1)!.id : null };
    });
  } };
}
