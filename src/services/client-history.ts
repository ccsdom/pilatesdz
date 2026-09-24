import { isCenterOperator } from "@/domain/models/access";
import { AccessError, type Access } from "@/domain/models/access";
import { monthRange } from "@/domain/models/client-history";
import { clientIdSchema } from "@/domain/models/client";
import { ManagementError } from "@/domain/ports/access-management";
import type { ClientHistoryRepository } from "@/domain/ports/client-history";
export function createClientHistoryService(repository: ClientHistoryRepository) {
  return { list(actor: Access, month: string, clientId?: string, after?: string) {
    if (clientId && !isCenterOperator(actor.role)) throw new AccessError(403);
    if ((clientId && !clientIdSchema.safeParse(clientId).success) || (isCenterOperator(actor.role) && !clientId)) throw new ManagementError(400, "Fiche cliente requise.");
    try { monthRange(month); } catch { throw new ManagementError(400, "Choisissez un mois valide, entre 2000 et 2100."); }
    if (after && !/^\d{1,16}_[a-zA-Z0-9_-]{1,128}$/.test(after)) throw new ManagementError(400, "Page invalide.");
    return repository.list(actor, month, clientId, after);
  } };
}
