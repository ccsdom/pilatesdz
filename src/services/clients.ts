import { AccessError, type Access } from "@/domain/models/access";
import { clientIdSchema, clientInputSchema } from "@/domain/models/client";
import { ManagementError, type AccountProvisioner } from "@/domain/ports/access-management";
import type { ClientRepository } from "@/domain/ports/clients";

export function createClientService(repository: ClientRepository, accounts: AccountProvisioner) {
  function admin(actor: Access) { if (actor.role !== "admin") throw new AccessError(403); }
  function id(value: string) { if (!clientIdSchema.safeParse(value).success) throw new ManagementError(400, "Identifiant invalide."); return value; }
  function input(value: unknown) {
    const result = clientInputSchema.safeParse(value);
    if (!result.success) throw new ManagementError(400, "Vérifiez le nom, l’e-mail, le téléphone et le statut.");
    return result.data;
  }
  return {
    create(actor: Access, value: unknown) { admin(actor); return repository.create(actor, input(value)); },
    update(actor: Access, clientId: string, version: number, value: unknown) {
      admin(actor);
      if (!Number.isSafeInteger(version) || version < 1) throw new ManagementError(400, "Version invalide.");
      return repository.update(actor, id(clientId), version, input(value));
    },
    get(actor: Access, clientId: string) { admin(actor); return repository.get(actor, id(clientId)); },
    list(actor: Access, search = "", after?: string) {
      admin(actor);
      if (search.length > 254) throw new ManagementError(400, "Recherche trop longue.");
      return repository.list(actor, search, after ? id(after) : undefined);
    },
    async invite(actor: Access, clientId: string) {
      admin(actor); id(clientId);
      const profile = await repository.reserveInvitation(actor, clientId);
      const uid = profile.authUid ?? profile.invitationUid;
      if (!uid) throw new Error("Missing invitation reservation");
      if (!profile.authUid) {
        try { await accounts.create(profile.email, profile.name, uid); }
        catch (error) {
          // An explicit account conflict created no identity; permit correcting the profile email.
          // An uncertain network failure keeps the reserved UID so a retry cannot create duplicates.
          if (error instanceof ManagementError && error.status === 409) await repository.releaseInvitation(actor, clientId, uid);
          throw error;
        }
      }
      await repository.link(actor, clientId, uid); // Recheck authorization and status after the Auth call.
      const invitationUrl = await accounts.invitation(profile.email);
      return { uid, clientId, invitationUrl, emailAccepted: invitationUrl === null };
    },
  };
}
