import { AccessError, type Access } from "@/domain/models/access";
import { clientIdSchema } from "@/domain/models/client";
import { packageInputSchema } from "@/domain/models/package";
import { ManagementError } from "@/domain/ports/access-management";
import type { PackageRepository } from "@/domain/ports/packages";
export function createPackageService(repository: PackageRepository) {
  function id(value: string) { if (!clientIdSchema.safeParse(value).success) throw new ManagementError(400, "Identifiant invalide."); return value; }
  return {
    assign(actor: Access, clientId: string, requestId: string, value: unknown) {
      if (actor.role !== "admin") throw new AccessError(403);
      const parsed = packageInputSchema.safeParse(value);
      if (!parsed.success) throw new ManagementError(400, "Vérifiez le forfait, les crédits et sa validité (366 jours maximum).");
      return repository.assign(actor, id(clientId), id(requestId), parsed.data);
    },
    list(actor: Access, clientId?: string, after?: string) {
      if (clientId && actor.role !== "admin") throw new AccessError(403);
      if (after && !/^\d{1,16}_[a-zA-Z0-9_-]{1,128}$/.test(after)) throw new ManagementError(400, "Page invalide.");
      return repository.list(actor, clientId ? id(clientId) : undefined, after);
    },
  };
}
