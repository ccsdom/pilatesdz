import type { Access } from "../models/access";
import type { SubscriptionPlan } from "../models/subscription";
export type SubscriptionRecord = SubscriptionPlan & { id: string; clientId: string; centerId: string; assignedAt: number };
export type SubscriptionPage = { subscriptions: SubscriptionRecord[]; next: string | null };
export interface SubscriptionRepository {
  list(actor: Access, clientId?: string, after?: string): Promise<SubscriptionPage>;
  assign(actor: Access, clientId: string, requestId: string, plan: SubscriptionPlan): Promise<SubscriptionRecord>;
}
