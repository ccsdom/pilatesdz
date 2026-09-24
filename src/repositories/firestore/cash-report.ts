import { isCenterOperator } from "@/domain/models/access";
import "server-only";
import { FieldPath, type Firestore } from "firebase-admin/firestore";
import { z } from "zod";
import { AccessError } from "@/domain/models/access";
import { clientIdSchema } from "@/domain/models/client";
import { cashMonthSchema, summarizeCash } from "@/domain/models/cash-report";
import type { CashReportRepository } from "@/domain/ports/cash-report";
import { ManagementError } from "@/domain/ports/access-management";
import { paymentSchema } from "./payments";

export function cashReportRepository(db: Firestore): CashReportRepository {
  return {
    async get(actor, month, after, scope = "page") {
      return db.runTransaction(async tx => {
        if (!isCenterOperator(actor.role) || !/^[a-z0-9-]+$/.test(actor.centerId) || !clientIdSchema.safeParse(actor.uid).success) throw new AccessError(403);
        cashMonthSchema.parse(month);
        const root = `centers/${actor.centerId}`;
        const member = (await tx.get(db.doc(`${root}/members/${actor.uid}`))).data();
        if (member?.uid !== actor.uid || member.centerId !== actor.centerId || member.role !== actor.role || !isCenterOperator(member.role) || member.active !== true) throw new AccessError(403);
        const [year, number] = month.split("-").map(Number);
        const nextMonth = number === 12 ? `${year + 1}-01` : `${year}-${String(number + 1).padStart(2, "0")}`;
        const snapshot = await tx.get(db.collectionGroup("payments").where("centerId", "==", actor.centerId)
          .where("receivedDate", ">=", `${month}-01`).where("receivedDate", "<", `${nextMonth}-01`)
          .orderBy("receivedDate", "desc").orderBy(FieldPath.documentId(), "desc").limit(1001));
        if (snapshot.size > 1000) throw new ManagementError(409, "Ce mois dépasse 1 000 écritures. Le récapitulatif ne peut pas afficher un total complet.");
        const all = snapshot.docs.map(doc => {
          const data = doc.data();
          const payment = paymentSchema.parse(data);
          const clientId = clientIdSchema.parse(data.clientId), subscriptionId = z.string().uuid().parse(data.subscriptionId);
          if (data.centerId !== actor.centerId || payment.id !== doc.id || doc.ref.path !== `${root}/clients/${clientId}/subscriptions/${subscriptionId}/payments/${payment.id}`) throw new Error("Invalid cash report identity");
          return { path: doc.ref.path, id: payment.id, clientId, subscriptionId, receivedDate: payment.receivedDate, amountMinor: payment.amountMinor, corrected: Boolean(payment.correction) };
        });
        let start = 0;
        if (after) {
          const path = Buffer.from(after, "base64url").toString("utf8");
          const index = all.findIndex(entry => entry.path === path);
          if (index < 0) throw new ManagementError(400, "Cette page n’est plus disponible pour ce mois. Revenez à la première page.");
          start = index + 1;
        }
        const slice = scope === "month" ? all : all.slice(start, start + 50);
        const clientIds = [...new Set(slice.map(entry => entry.clientId))];
        const profiles = clientIds.length ? await tx.getAll(...clientIds.map(id => db.doc(`${root}/clients/${id}`))) : [];
        const names = new Map(profiles.map(profile => {
          const data = profile.data();
          return [profile.id, data?.id === profile.id && data.centerId === actor.centerId && typeof data.name === "string" ? data.name : "Fiche cliente indisponible"];
        }));
        const last = slice.at(-1);
        return { month, summary: summarizeCash(all), entries: slice.map(entry => ({ id: entry.id, clientId: entry.clientId, clientName: names.get(entry.clientId)!, subscriptionId: entry.subscriptionId, receivedDate: entry.receivedDate, amountMinor: entry.amountMinor, corrected: entry.corrected })),
          next: scope === "page" && start + slice.length < all.length && last ? Buffer.from(last.path).toString("base64url") : null };
      });
    },
  };
}
