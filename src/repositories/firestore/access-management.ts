import "server-only";
import type { Firestore, Transaction } from "firebase-admin/firestore";
import { AccessError, type Access } from "@/domain/models/access";
import { ManagementError, type AccessRepository, type ClientAccess } from "@/domain/ports/access-management";

export function accessRepository(db: Firestore): AccessRepository {
  function ref(actor: Access, uid: string) {
    if (!/^[a-z0-9-]+$/.test(actor.centerId) || !uid || uid.includes("/")) throw new AccessError(403);
    return db.doc(`centers/${actor.centerId}/members/${uid}`);
  }
  async function administrator(tx: Transaction, actor: Access) {
    const data = (await tx.get(ref(actor, actor.uid))).data();
    if (data?.uid !== actor.uid || data.centerId !== actor.centerId || data.role !== "admin" || data.active !== true) throw new AccessError(403);
  }
  async function client(tx: Transaction, actor: Access, uid: string): Promise<ClientAccess> {
    await administrator(tx, actor);
    const data = (await tx.get(ref(actor, uid))).data();
    if (!data) throw new ManagementError(404, "Accès introuvable dans ce centre.");
    if (data.uid !== uid || data.centerId !== actor.centerId || data.role !== "client" || typeof data.active !== "boolean") throw new AccessError(403);
    return { uid, email: typeof data.email === "string" ? data.email : "", name: typeof data.name === "string" ? data.name : uid, active: data.active };
  }
  return {
    async add(actor, member) {
      await db.runTransaction(async (tx) => {
        await administrator(tx, actor);
        tx.create(ref(actor, member.uid), { ...member, centerId: actor.centerId, role: "client", createdAt: Date.now(), createdBy: actor.uid });
      });
    },
    find: (actor, uid) => db.runTransaction((tx) => client(tx, actor, uid)),
    async deactivate(actor, uid) {
      await db.runTransaction(async (tx) => {
        await client(tx, actor, uid);
        if (actor.uid === uid) throw new AccessError(403);
        tx.update(ref(actor, uid), { active: false, deactivatedAt: Date.now(), deactivatedBy: actor.uid });
      });
    },
  };
}
