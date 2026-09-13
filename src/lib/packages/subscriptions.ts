import "server-only";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { subscriptionsRepository } from "@/repositories/firestore/subscriptions";
import { createSubscriptionService } from "@/services/subscriptions";
export function getSubscriptionService() { return createSubscriptionService(subscriptionsRepository(getFirebaseAdmin().firestore)); }
