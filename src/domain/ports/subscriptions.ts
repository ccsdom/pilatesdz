import type { Access } from "../models/access";
import type { SubscriptionPlan } from "../models/subscription";
export type SubscriptionRecord = SubscriptionPlan & { id: string; clientId: string; centerId: string; assignedAt: number };
export interface SubscriptionRepository {
  assign(actor: Access, clientId: string, requestId: string, plan: SubscriptionPlan): Promise<SubscriptionRecord>;
}
