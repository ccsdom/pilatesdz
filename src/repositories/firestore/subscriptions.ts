import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import { AccessError } from "@/domain/models/access";
import { studioDay } from "@/domain/models/planning";
import { ManagementError } from "@/domain/ports/access-management";
import type { SubscriptionRepository, SubscriptionRecord } from "@/domain/ports/subscriptions";

export function subscriptionsRepository(db: Firestore, now = Date.now): SubscriptionRepository {
  return {
    async assign(actor, clientId, requestId, plan) {
      return db.runTransaction(async tx => {
        if (actor.role !== "admin" || !/^[a-z0-9-]+$/.test(actor.centerId)
          || !/^[a-zA-Z0-9_-]{1,128}$/.test(clientId) || !/^[a-zA-Z0-9_-]{1,128}$/.test(requestId)) throw new AccessError(403);
        const root = `centers/${actor.centerId}`;
        const member = (await tx.get(db.doc(`${root}/members/${actor.uid}`))).data();
        if (member?.uid !== actor.uid || member.centerId !== actor.centerId || member.role !== "admin" || member.active !== true) throw new AccessError(403);
        const profile = db.doc(`${root}/clients/${clientId}`);
        const client = (await tx.get(profile)).data();
        if (!client || client.id !== clientId || client.centerId !== actor.centerId) throw new ManagementError(404, "Cliente introuvable dans ce centre.");
        const ref = profile.collection("subscriptions").doc(requestId);
        const previous = (await tx.get(ref)).data();
        if (previous) {
          if (previous.assignedBy !== actor.uid || previous.offerId !== plan.offerId || previous.term !== plan.term || previous.purchaseDate !== plan.purchaseDate) {
            throw new ManagementError(409, "Cette demande correspond déjà à un autre abonnement.");
          }
          return { id: previous.id, clientId: previous.clientId, centerId: previous.centerId, assignedAt: previous.assignedAt,
            offerId: previous.offerId, term: previous.term, purchaseDate: previous.purchaseDate,
            amountDzd: previous.amountDzd, currency: previous.currency, pricingVersion: previous.pricingVersion, periods: previous.periods } as SubscriptionRecord;
        }
        if (client.status !== "active") throw new ManagementError(409, "Réactivez la fiche avant d’attribuer un abonnement.");
        const at = now();
        if (plan.purchaseDate > studioDay(at) || plan.periods.at(-1)!.expiresAt <= at) {
          throw new ManagementError(400, "La date d’achat ne peut pas être future et l’abonnement doit encore être valable.");
        }
        const active = await tx.get(profile.collection("packages").where("expiresAt", ">", at).limit(100));
        if (active.size + plan.periods.length > 100) throw new ManagementError(409, "Limite de 100 forfaits non expirés atteinte.");
        const start = plan.periods[0].validFrom, end = plan.periods.at(-1)!.expiresAt;
        if (active.docs.some(doc => { const pack = doc.data(); return typeof pack.subscriptionId === "string" && pack.validFrom < end && pack.expiresAt > start; })) {
          throw new ManagementError(409, "Un abonnement couvre déjà tout ou partie de cette période.");
        }
        const record: SubscriptionRecord = { ...plan, id: requestId, centerId: actor.centerId, clientId, assignedAt: at };
        tx.create(ref, { ...record, assignedBy: actor.uid, paymentRecorded: false });
        plan.periods.forEach((period, index) => {
          const id = `sub-${requestId}-${index + 1}`;
          const pack = profile.collection("packages").doc(id);
          tx.create(pack, { ...period, id, centerId: actor.centerId, clientId, remaining: period.credits,
            assignedAt: at, assignedBy: actor.uid, subscriptionId: requestId, period: index + 1 });
          tx.create(pack.collection("movements").doc("assignment"), { delta: period.credits, reason: "assignment", at, actorUid: actor.uid });
        });
        // Serializes concurrent assignments for this customer, including manual packages.
        tx.update(profile, { lastPackageAssignedAt: at });
        return record;
      });
    },
  };
}
