import "server-only";
import { FieldPath, type Firestore, type Transaction } from "firebase-admin/firestore";
import { z } from "zod";
import { AccessError, type Access } from "@/domain/models/access";
import { clientIdSchema } from "@/domain/models/client";
import { paymentCorrectionSchema, paymentInputSchema } from "@/domain/models/payment";
import { subscriptionInputSchema } from "@/domain/models/subscription";
import { studioDay } from "@/domain/models/planning";
import { ManagementError } from "@/domain/ports/access-management";
import type { PaymentRepository } from "@/domain/ports/payments";

const correctionSchema = paymentCorrectionSchema.extend({ id: z.string().uuid(), recordedAt: z.number().int().nonnegative().safe(), amountMinor: z.number().int().negative().safe() }).strip();
const paymentSchema = paymentInputSchema.extend({ id: z.string().uuid(), recordedAt: z.number().int().nonnegative().safe(),
  correction: z.object({ id: z.string().uuid(), reason: z.string().min(5).max(300), recordedAt: z.number().int().nonnegative().safe() }).strict().optional(),
}).strip();
export function paymentsRepository(db: Firestore, now = Date.now): PaymentRepository {
  async function context(tx: Transaction, actor: Access, clientId: string, subscriptionId: string) {
    if (actor.role !== "admin" || !/^[a-z0-9-]+$/.test(actor.centerId) || !clientIdSchema.safeParse(actor.uid).success
      || !clientIdSchema.safeParse(clientId).success || !z.string().uuid().safeParse(subscriptionId).success) throw new AccessError(403);
    const root = `centers/${actor.centerId}`;
    const member = (await tx.get(db.doc(`${root}/members/${actor.uid}`))).data();
    if (member?.uid !== actor.uid || member.centerId !== actor.centerId || member.role !== "admin" || member.active !== true) throw new AccessError(403);
    const client = (await tx.get(db.doc(`${root}/clients/${clientId}`))).data();
    if (!client || client.id !== clientId || client.centerId !== actor.centerId) throw new ManagementError(404, "Cliente introuvable.");
    const ref = db.doc(`${root}/clients/${clientId}/subscriptions/${subscriptionId}`);
    const subscription = (await tx.get(ref)).data();
    if (!subscription || subscription.id !== subscriptionId || subscription.clientId !== clientId || subscription.centerId !== actor.centerId) throw new ManagementError(404, "Abonnement introuvable.");
    const totalMinor = subscription.amountDzd * 100;
    const paidMinor = subscription.paidMinor ?? 0;
    if (subscription.currency !== "DZD" || !Number.isSafeInteger(subscription.amountDzd) || !Number.isSafeInteger(totalMinor) || totalMinor <= 0
      || !Number.isSafeInteger(paidMinor) || paidMinor < 0 || paidMinor > totalMinor
      || !subscriptionInputSchema.shape.purchaseDate.safeParse(subscription.purchaseDate).success) throw new Error("Invalid subscription balance");
    return { ref, totalMinor, paidMinor, purchaseDate: subscription.purchaseDate as string };
  }
  return {
    async correct(actor, clientId, subscriptionId, requestId, input) {
      return db.runTransaction(async tx => {
        const ctx = await context(tx, actor, clientId, subscriptionId);
        if (!z.string().uuid().safeParse(requestId).success) throw new ManagementError(400, "Demande invalide.");
        const correction = paymentCorrectionSchema.parse(input);
        const ref = ctx.ref.collection("paymentCorrections").doc(requestId);
        const previous = (await tx.get(ref)).data();
        if (previous) {
          if (previous.recordedBy !== actor.uid || previous.centerId !== actor.centerId || previous.clientId !== clientId || previous.subscriptionId !== subscriptionId
            || previous.paymentId !== correction.paymentId || previous.reason !== correction.reason) throw new ManagementError(409, "Cette demande correspond déjà à une autre correction.");
          return correctionSchema.parse(previous);
        }
        const paymentRef = ctx.ref.collection("payments").doc(correction.paymentId);
        const data = (await tx.get(paymentRef)).data();
        if (!data || data.id !== correction.paymentId || data.clientId !== clientId || data.subscriptionId !== subscriptionId || data.centerId !== actor.centerId) throw new ManagementError(404, "Encaissement introuvable.");
        const payment = paymentSchema.parse(data);
        if (payment.correction) throw new ManagementError(409, "Cette saisie a déjà été annulée. Actualisez le journal.");
        if (payment.amountMinor > ctx.paidMinor) throw new Error("Invalid correction balance");
        const record = { ...correction, id: requestId, recordedAt: now(), amountMinor: -payment.amountMinor };
        tx.create(ref, { ...record, centerId: actor.centerId, clientId, subscriptionId, recordedBy: actor.uid });
        // Preserve the original amount, reception date and author; append correction metadata only.
        tx.update(paymentRef, { correction: { id: requestId, reason: correction.reason, recordedAt: record.recordedAt } });
        tx.update(ctx.ref, { paidMinor: ctx.paidMinor - payment.amountMinor });
        return record;
      });
    },
    async list(actor, clientId, subscriptionId, after) {
      return db.runTransaction(async tx => {
        const ctx = await context(tx, actor, clientId, subscriptionId);
        let query = ctx.ref.collection("payments").orderBy("recordedAt", "desc").orderBy(FieldPath.documentId(), "desc").limit(21);
        if (after) { const split = after.indexOf("_"); query = query.startAfter(Number(after.slice(0, split)), after.slice(split + 1)); }
        const snapshot = await tx.get(query);
        const payments = snapshot.docs.slice(0, 20).map(doc => {
          const data = doc.data();
          if (data.id !== doc.id || data.centerId !== actor.centerId || data.clientId !== clientId || data.subscriptionId !== subscriptionId) throw new Error("Invalid payment identity");
          return paymentSchema.parse(data);
        });
        const last = payments.at(-1);
        return { clientId, subscriptionId, totalMinor: ctx.totalMinor, paidMinor: ctx.paidMinor, purchaseDate: ctx.purchaseDate,
          payments, next: snapshot.size > 20 && last ? `${last.recordedAt}_${last.id}` : null };
      });
    },
    async record(actor, clientId, subscriptionId, requestId, input) {
      return db.runTransaction(async tx => {
        const ctx = await context(tx, actor, clientId, subscriptionId);
        if (!z.string().uuid().safeParse(requestId).success) throw new ManagementError(400, "Demande invalide.");
        const payment = paymentInputSchema.parse(input);
        const ref = ctx.ref.collection("payments").doc(requestId);
        const previous = (await tx.get(ref)).data();
        if (previous) {
          if (previous.recordedBy !== actor.uid || previous.centerId !== actor.centerId || previous.clientId !== clientId || previous.subscriptionId !== subscriptionId
            || Object.entries(payment).some(([key, value]) => previous[key] !== value)) throw new ManagementError(409, "Cette demande correspond déjà à un autre encaissement.");
          return paymentSchema.parse(previous);
        }
        const at = now();
        if (payment.receivedDate < ctx.purchaseDate || payment.receivedDate > studioDay(at)) throw new ManagementError(400, "La réception doit être comprise entre la date d’achat et aujourd’hui.");
        if (payment.amountMinor > ctx.totalMinor - ctx.paidMinor) throw new ManagementError(409, "Ce montant dépasse le solde restant à enregistrer. Actualisez le journal.");
        const record = { ...payment, id: requestId, recordedAt: at };
        tx.create(ref, { ...record, centerId: actor.centerId, clientId, subscriptionId, recordedBy: actor.uid });
        tx.update(ctx.ref, { paidMinor: ctx.paidMinor + payment.amountMinor, paymentRecorded: true });
        return record;
      });
    },
  };
}
