import "server-only";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { planningRepository } from "@/repositories/firestore/planning";
import { createPlanningService } from "@/services/planning";

export function getPlanningService() { return createPlanningService(planningRepository(getFirebaseAdmin().firestore)); }
