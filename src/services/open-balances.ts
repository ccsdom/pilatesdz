import { isCenterOperator } from "@/domain/models/access";
import { AccessError, type Access } from "@/domain/models/access";
import { clientIdSchema } from "@/domain/models/client";
import { ManagementError } from "@/domain/ports/access-management";
import type { OpenBalanceRepository } from "@/domain/ports/open-balances";
export function createOpenBalanceService(repository: OpenBalanceRepository) {
  return { list(actor: Access, after?: string) {
    if (!isCenterOperator(actor.role)) throw new AccessError(403);
    if (after !== undefined && !clientIdSchema.safeParse(after).success) throw new ManagementError(400, "Page invalide.");
    return repository.list(actor, after);
  } };
}
