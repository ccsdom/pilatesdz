import "server-only";
import { createHash } from "node:crypto";
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
  async function operator(tx: Transaction, actor: Access) {
    const data = (await tx.get(ref(actor, actor.uid))).data();
    if (data?.uid !== actor.uid || data.centerId !== actor.centerId || !["admin", "manager"].includes(data.role) || data.active !== true) throw new AccessError(403);
  }
  async function client(tx: Transaction, actor: Access, uid: string): Promise<ClientAccess> {
    await operator(tx, actor);
    const data = (await tx.get(ref(actor, uid))).data();
    if (!data) throw new ManagementError(404, "Accès introuvable dans ce centre.");
    if (data.uid !== uid || data.centerId !== actor.centerId || !["client", "manager"].includes(data.role) || typeof data.active !== "boolean") throw new AccessError(403);
    return { uid, email: typeof data.email === "string" ? data.email : "", name: typeof data.name === "string" ? data.name : uid, active: data.active, role: data.role, ...(data.clientId ? { clientId: data.clientId } : {}) };
  }
  return {
    async reserveManager(actor, email, name) {
      return db.runTransaction(async tx => {
        await administrator(tx, actor);
        const uid = `manager_${createHash("sha256").update(`${actor.centerId}/${email}`).digest("hex")}`;
        const reservation = db.doc(`centers/${actor.centerId}/staffInvitations/${uid}`);
        const previous = await tx.get(reservation);
        const member = await tx.get(ref(actor, uid));
        if (member.exists && (member.data()?.uid !== uid || member.data()?.centerId !== actor.centerId || member.data()?.role !== "manager" || member.data()?.email !== email || member.data()?.active !== true)) throw new ManagementError(409, "Ce compte existe déjà. Utilisez la gestion de son accès.");
        if (previous.exists) {
          if (previous.data()?.email !== email || previous.data()?.name !== name) throw new ManagementError(409, "Une invitation existe déjà avec d’autres informations.");
        } else tx.create(reservation, { uid, email, name, createdAt: Date.now(), createdBy: actor.uid });
        return uid;
      });
    },
    async addManager(actor, uid) {
      await db.runTransaction(async tx => {
        await administrator(tx, actor);
        const invitation = await tx.get(db.doc(`centers/${actor.centerId}/staffInvitations/${uid}`));
        const data = invitation.data();
        const member = await tx.get(ref(actor, uid));
        if (!data || data.uid !== uid) throw new AccessError(403);
        if (member.exists) {
          if (member.data()?.uid !== uid || member.data()?.centerId !== actor.centerId || member.data()?.role !== "manager" || member.data()?.active !== true || member.data()?.email !== data.email) throw new AccessError(403);
          return;
        }
        tx.create(member.ref, { uid, email: data.email, name: data.name, centerId: actor.centerId, role: "manager", active: true, createdAt: Date.now(), createdBy: actor.uid });
        tx.create(member.ref.collection("accessEvents").doc(), { action: "created", role: "manager", at: Date.now(), actorUid: actor.uid });
        tx.update(invitation.ref, { completedAt: Date.now() });
      });
    },
    async reactivate(actor, uid) {
      await db.runTransaction(async tx => {
        const member = await client(tx, actor, uid);
        if (actor.uid === uid) throw new AccessError(403);
        if (member.role === "manager" && actor.role !== "admin") throw new ManagementError(403, "Seul un administrateur peut modifier l’accès d’un manager.");
        if (member.role === "client") {
          if (!member.clientId || member.clientId.includes("/")) throw new ManagementError(409, "La fiche cliente doit être reliée à cet accès.");
          const profile = (await tx.get(db.doc(`centers/${actor.centerId}/clients/${member.clientId}`))).data();
          if (!profile || profile.authUid !== uid || profile.centerId !== actor.centerId || profile.status !== "active") throw new ManagementError(409, "Activez et vérifiez la fiche cliente avant de réactiver son accès.");
        }
        if (member.active) return;
        tx.update(ref(actor, uid), { active: true, reactivatedAt: Date.now(), reactivatedBy: actor.uid });
        tx.create(ref(actor, uid).collection("accessEvents").doc(), { action: "reactivated", at: Date.now(), actorUid: actor.uid });
      });
    },
    async add(actor, member) {
      await db.runTransaction(async (tx) => {
        await operator(tx, actor);
        tx.create(ref(actor, member.uid), { ...member, centerId: actor.centerId, role: "client", createdAt: Date.now(), createdBy: actor.uid });
      });
    },
    find: (actor, uid) => db.runTransaction((tx) => client(tx, actor, uid)),
    async deactivate(actor, uid) {
      await db.runTransaction(async (tx) => {
        const member = await client(tx, actor, uid);
        if (actor.uid === uid) throw new AccessError(403);
        if (member.role === "manager" && actor.role !== "admin") throw new ManagementError(403, "Seul un administrateur peut modifier l’accès d’un manager.");
        if (!member.active) return;
        tx.update(ref(actor, uid), { active: false, deactivatedAt: Date.now(), deactivatedBy: actor.uid });
        tx.create(ref(actor, uid).collection("accessEvents").doc(), { action: "deactivated", at: Date.now(), actorUid: actor.uid });
      });
    },
  };
}
