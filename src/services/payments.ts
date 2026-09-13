import { z } from "zod";
import { AccessError, type Access } from "@/domain/models/access";
import { clientIdSchema } from "@/domain/models/client";
import { paymentCorrectionSchema, paymentInputSchema } from "@/domain/models/payment";
import { ManagementError } from "@/domain/ports/access-management";
import type { PaymentRepository } from "@/domain/ports/payments";

export function createPaymentService(repository: PaymentRepository) {
  function check(actor: Access, clientId: string, subscriptionId: string) {
    if (actor.role !== "admin") throw new AccessError(403);
    if (!clientIdSchema.safeParse(clientId).success || !z.string().uuid().safeParse(subscriptionId).success) throw new ManagementError(400, "Identifiant invalide.");
  }
  return {
    correct(actor: Access, clientId: string, subscriptionId: string, requestId: string, value: unknown) {
      check(actor, clientId, subscriptionId);
      const parsed = paymentCorrectionSchema.safeParse(value);
      if (!parsed.success || !z.string().uuid().safeParse(requestId).success) throw new ManagementError(400, "Indiquez l’encaissement et un motif de 5 à 300 caractères.");
      return repository.correct(actor, clientId, subscriptionId, requestId, parsed.data);
    },
    list(actor: Access, clientId: string, subscriptionId: string, after?: string) {
      check(actor, clientId, subscriptionId);
      if (after !== undefined && !/^\d{1,15}_[a-zA-Z0-9-]{36}$/.test(after)) throw new ManagementError(400, "Page invalide.");
      return repository.list(actor, clientId, subscriptionId, after);
    },
    record(actor: Access, clientId: string, subscriptionId: string, requestId: string, value: unknown) {
      check(actor, clientId, subscriptionId);
      const parsed = paymentInputSchema.safeParse(value);
      if (!parsed.success || !z.string().uuid().safeParse(requestId).success) throw new ManagementError(400, "Vérifiez le montant et la date de réception des espèces.");
      return repository.record(actor, clientId, subscriptionId, requestId, parsed.data);
    },
  };
}
