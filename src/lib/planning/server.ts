import "server-only";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { planningRepository } from "@/repositories/firestore/planning";
import { createPlanningService } from "@/services/planning";
import { ensureAutomaticSlots } from "@/repositories/firestore/automatic-slots";
import { AccessError, type Access } from "@/domain/models/access";

export function getPlanningService() {
  const db = getFirebaseAdmin().firestore;
  const service = createPlanningService(planningRepository(db));
  return {
    ...service,
    async list(actor: Access, day: string, after?: string) {
      await ensureAutomaticSlots(db, actor, day);
      return service.list(actor, day, after);
    },
    async daySessions(actor: Access, day: string) {
      if (actor.role !== "admin") throw new AccessError(403);
      await ensureAutomaticSlots(db, actor, day);
      return service.daySessions(actor, day);
    },
    async rangeSessions(actor: Access, from: string, to: string) {
      if (actor.role !== "admin") throw new AccessError(403);
      await ensureAutomaticSlots(db, actor, from, to);
      return service.rangeSessions(actor, from, to);
    },
  };
}
