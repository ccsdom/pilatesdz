import { AccessError, type Access } from "@/domain/models/access";
import { clientIdSchema } from "@/domain/models/client";
import { planSubscription, subscriptionInputSchema } from "@/domain/models/subscription";
import { ManagementError } from "@/domain/ports/access-management";
import type { SubscriptionRepository } from "@/domain/ports/subscriptions";
import { z } from "zod";

export function createSubscriptionService(repository: SubscriptionRepository) {
  return {
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
