import { isCenterOperator, AccessError, type Access } from "@/domain/models/access";
import { ManagementError, type AccessRepository, type AccountProvisioner } from "@/domain/ports/access-management";

export function createAccessManagement(accounts: AccountProvisioner, members: AccessRepository) {
  function requireAdmin(actor: Access) { if (actor.role !== "admin") throw new AccessError(403); }
  function requireOperator(actor: Access) { if (!isCenterOperator(actor.role)) throw new AccessError(403); }
  return {
    async inviteManager(actor: Access, email: string, name: string) {
      requireAdmin(actor);
      const uid = await members.reserveManager(actor, email, name);
      await accounts.create(email, name, uid);
      await members.addManager(actor, uid);
      try {
        const invitationUrl = await accounts.invitation(email);
        return { uid, invitationUrl, emailAccepted: invitationUrl === null };
      } catch { throw new ManagementError(409, "Le compte Manager est créé, mais l’envoi n’est pas confirmé. Reprenez depuis la liste après une minute."); }
    },
    async reactivate(actor: Access, uid: string) {
      requireOperator(actor);
      if (uid === actor.uid) throw new AccessError(403);
      await members.reactivate(actor, uid);
    },
    async invite(actor: Access, email: string, name: string) {
      requireOperator(actor);
      const uid = await accounts.create(email, name);
      await members.add(actor, { uid, email, name, active: true });
      // A delivery failure leaves a manageable account; the operator can renew its link.
      try { const invitationUrl = await accounts.invitation(email); return { uid, invitationUrl, emailAccepted: invitationUrl === null }; }
      catch { throw new ManagementError(409, "Le compte est créé, mais l’invitation n’est pas confirmée. Reprenez depuis la liste après une minute."); }
    },
    async invitation(actor: Access, uid: string) {
      requireOperator(actor);
      const member = await members.find(actor, uid);
      if (!member.active) throw new AccessError(403);
      const invitationUrl = await accounts.invitation(member.email);
      return { invitationUrl, emailAccepted: invitationUrl === null };
    },
    async deactivate(actor: Access, uid: string) {
      requireOperator(actor);
      if (uid === actor.uid) throw new AccessError(403);
      await members.deactivate(actor, uid);
    },
  };
}
