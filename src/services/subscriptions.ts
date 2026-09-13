import { AccessError, type Access } from "@/domain/models/access";
import { clientIdSchema } from "@/domain/models/client";
import { planSubscription, subscriptionInputSchema } from "@/domain/models/subscription";
import { ManagementError } from "@/domain/ports/access-management";
import type { SubscriptionRepository } from "@/domain/ports/subscriptions";
import { z } from "zod";

export function createSubscriptionService(repository: SubscriptionRepository) {
  return {
    list(actor: Access, clientId?: string, after?: string) {
      if (clientId !== undefined && actor.role !== "admin") throw new AccessError(403);
      if (clientId !== undefined && !clientIdSchema.safeParse(clientId).success) throw new ManagementError(400, "Identifiant invalide.");
      if (after !== undefined && !/^\d{1,15}_[a-zA-Z0-9_-]{1,128}$/.test(after)) throw new ManagementError(400, "Page invalide.");
      return repository.list(actor, clientId, after);
    },
    assign(actor: Access, clientId: string, requestId: string, value: unknown) {
      if (actor.role !== "admin") throw new AccessError(403);
      const parsed = subscriptionInputSchema.safeParse(value);
      if (!parsed.success || !clientIdSchema.safeParse(clientId).success || !z.string().uuid().safeParse(requestId).success) {
        throw new ManagementError(400, "Vérifiez la formule, la durée et la date d’achat.");
      }
      return repository.assign(actor, clientId, requestId, planSubscription(parsed.data));
    },
  };
}
