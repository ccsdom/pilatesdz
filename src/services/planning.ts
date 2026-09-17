import { AccessError, type Access } from "@/domain/models/access";
import { clientIdSchema } from "@/domain/models/client";
import { sessionInputSchema, dayRange } from "@/domain/models/planning";
import { ManagementError } from "@/domain/ports/access-management";
import type { PlanningRepository } from "@/domain/ports/planning";

export function createPlanningService(repository: PlanningRepository) {
  function id(value: string) { if (!clientIdSchema.safeParse(value).success) throw new ManagementError(400, "Identifiant invalide."); return value; }
  function admin(actor: Access) { if (actor.role !== "admin") throw new AccessError(403); }
  return {
    pendingAttendance(actor: Access, from: string, to: string) {
      admin(actor);
      try {
        const start = dayRange(from).start, end = dayRange(to).end;
        if (end <= start || end - start > 31 * 86400000) throw new Error("range");
      } catch { throw new ManagementError(400, "Choisissez une période valide de 31 jours maximum."); }
      return repository.pendingAttendance(actor, from, to);
    },
    daySessions(actor: Access, day: string) {
      admin(actor);
      try { dayRange(day); } catch { throw new ManagementError(400, "Date du planning invalide."); }
      return repository.daySessions(actor, day);
    },
    rangeSessions(actor: Access, from: string, to: string) {
      admin(actor);
      try {
        const start = dayRange(from).start, end = dayRange(to).end;
        if (end <= start || end - start > 42 * 86400000) throw new Error("range");
      } catch { throw new ManagementError(400, "Choisissez une période valide de 42 jours maximum."); }
      return repository.rangeSessions(actor, from, to);
    },
    create(actor: Access, requestId: string, value: unknown) {
      admin(actor); id(requestId);
      const parsed = sessionInputSchema.safeParse(value);
      if (!parsed.success) throw new ManagementError(400, "Vérifiez le cours, les horaires, la durée et la capacité.");
      return repository.create(actor, requestId, parsed.data);
    },
    list(actor: Access, day: string, after?: string) {
      try { dayRange(day); } catch { throw new ManagementError(400, "Date du planning invalide."); }
      if (after && !/^\d{1,16}_[a-zA-Z0-9_-]{1,128}$/.test(after)) throw new ManagementError(400, "Page invalide.");
      return repository.list(actor, day, after);
    },
    get: (actor: Access, sessionId: string) => repository.get(actor, id(sessionId)),
    book(actor: Access, sessionId: string) {
      if (actor.role !== "client") throw new AccessError(403);
      return repository.book(actor, id(sessionId));
    },
    bookForClient(actor: Access, sessionId: string, clientId: string) {
      admin(actor);
      return repository.book(actor, id(sessionId), id(clientId));
    },
    cancelBooking(actor: Access, sessionId: string, clientId?: string) {
      if (clientId) { admin(actor); id(clientId); }
      return repository.cancelBooking(actor, id(sessionId), clientId);
    },
    cancelSession(actor: Access, sessionId: string) { admin(actor); return repository.cancelSession(actor, id(sessionId)); },
  };
}
