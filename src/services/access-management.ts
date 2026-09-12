import { AccessError, type Access } from "@/domain/models/access";
import { ManagementError, type AccessRepository, type AccountProvisioner } from "@/domain/ports/access-management";

export function createAccessManagement(accounts: AccountProvisioner, members: AccessRepository) {
  function requireAdmin(actor: Access) { if (actor.role !== "admin") throw new AccessError(403); }
  return {
    async invite(actor: Access, email: string, name: string) {
      requireAdmin(actor);
      const uid = await accounts.create(email, name);
      await members.add(actor, { uid, email, name, active: true });
      // A delivery failure leaves a manageable account; the administrator can renew its link.
      try { return { uid, invitationUrl: await accounts.invitation(email) }; }
      catch { throw new ManagementError(409, "Le compte est créé, mais son lien n’a pas pu être préparé. Utilisez « Nouveau lien de test » dans la liste."); }
    },
    async invitation(actor: Access, uid: string) {
      requireAdmin(actor);
      const member = await members.find(actor, uid);
      if (!member.active) throw new AccessError(403);
      return { invitationUrl: await accounts.invitation(member.email) };
    },
    async deactivate(actor: Access, uid: string) {
      requireAdmin(actor);
      if (uid === actor.uid) throw new AccessError(403);
      await members.deactivate(actor, uid);
    },
  };
}
