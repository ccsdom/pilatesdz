import "server-only";
import { createHash } from "node:crypto";
import { FieldPath, type Firestore, type Transaction, type DocumentData } from "firebase-admin/firestore";
import { AccessError, type Access } from "@/domain/models/access";
import { clientIdSchema, clientInputSchema, clientSearchPrefixes, normalizeSearch, type ClientProfile } from "@/domain/models/client";
import { ManagementError } from "@/domain/ports/access-management";
import type { ClientRepository } from "@/domain/ports/clients";

export function clientRepository(db: Firestore): ClientRepository {
  const base = (actor: Access) => {
    if (actor.role !== "admin" || !/^[a-z0-9-]+$/.test(actor.centerId)) throw new AccessError(403);
    return `centers/${actor.centerId}`;
  };
  const profileRef = (actor: Access, id: string) => {
    if (!clientIdSchema.safeParse(id).success) throw new ManagementError(400, "Identifiant invalide.");
    return db.doc(`${base(actor)}/clients/${id}`);
  };
  const memberRef = (actor: Access, uid: string) => {
    if (!uid || uid.includes("/")) throw new AccessError(403);
    return db.doc(`${base(actor)}/members/${uid}`);
  };
  const emailRef = (actor: Access, email: string) => db.doc(`${base(actor)}/clientEmails/${createHash("sha256").update(email).digest("hex")}`);
  async function emailAvailable(tx: Transaction, actor: Access, email: string, exceptId?: string) {
    const lock = await tx.get(emailRef(actor, email));
    const matches = await tx.get(db.collection(`${base(actor)}/clients`).where("email", "==", email).limit(2));
    if ((lock.exists && lock.data()?.clientId !== exceptId) || matches.docs.some(doc => doc.id !== exceptId)) throw new ManagementError(409, "Une fiche utilise déjà cette adresse dans ce centre.");
  }
  async function administrator(tx: Transaction, actor: Access) {
    const member = (await tx.get(memberRef(actor, actor.uid))).data();
    if (member?.uid !== actor.uid || member.centerId !== actor.centerId || member.role !== "admin" || member.active !== true) throw new AccessError(403);
  }
  function decode(actor: Access, id: string, data?: DocumentData): ClientProfile {
    if (!data) throw new ManagementError(404, "Fiche cliente introuvable dans ce centre.");
    const input = clientInputSchema.safeParse({ name: data.name, email: data.email, phone: data.phone, status: data.status });
    if (!input.success || data.id !== id || data.centerId !== actor.centerId ||
        !(data.authUid === null || (typeof data.authUid === "string" && clientIdSchema.safeParse(data.authUid).success)) ||
        !(data.invitationUid === null || (typeof data.invitationUid === "string" && clientIdSchema.safeParse(data.invitationUid).success)) ||
        !Number.isSafeInteger(data.version) || data.version < 1 || typeof data.createdAt !== "number" || typeof data.updatedAt !== "number") throw new Error("Invalid client record");
    return { ...input.data, id, centerId: actor.centerId, authUid: data.authUid, invitationUid: data.invitationUid, version: data.version, createdAt: data.createdAt, updatedAt: data.updatedAt };
  }
  function linkedMember(actor: Access, profile: ClientProfile, member?: DocumentData) {
    if (!member || member.uid !== profile.authUid || member.centerId !== actor.centerId || member.role !== "client" || member.clientId !== profile.id || typeof member.active !== "boolean") throw new AccessError(403);
    return member;
  }
  return {
    async create(actor, input) {
      const ref = db.collection(`${base(actor)}/clients`).doc();
      return db.runTransaction(async (tx) => {
        await administrator(tx, actor);
        await emailAvailable(tx, actor, input.email);
        const now = Date.now();
        const profile: ClientProfile = { ...input, id: ref.id, centerId: actor.centerId, authUid: null, invitationUid: null, version: 1, createdAt: now, updatedAt: now };
        tx.create(ref, { ...profile, searchPrefixes: clientSearchPrefixes(input), createdBy: actor.uid, updatedBy: actor.uid });
        tx.create(emailRef(actor, input.email), { clientId: ref.id });
        return profile;
      });
    },
    async get(actor, id) {
      return db.runTransaction(async (tx) => {
        await administrator(tx, actor);
        const profile = decode(actor, id, (await tx.get(profileRef(actor, id))).data());
        const access = profile.authUid ? (linkedMember(actor, profile, (await tx.get(memberRef(actor, profile.authUid))).data()).active ? "active" : "disabled") : profile.invitationUid ? "pending" : "none";
        return { profile, access };
      });
    },
    async list(actor, search, after) {
      return db.runTransaction(async (tx) => {
        await administrator(tx, actor);
        let query = db.collection(`${base(actor)}/clients`).orderBy(FieldPath.documentId()).limit(26);
        const normalized = normalizeSearch(search);
        if (normalized) query = query.where("searchPrefixes", "array-contains", normalized);
        if (after) { profileRef(actor, after); query = query.startAfter(after); }
        const snapshot = await tx.get(query);
        const docs = snapshot.docs.slice(0, 25);
        return { clients: docs.map((doc) => decode(actor, doc.id, doc.data())), next: snapshot.size > 25 ? docs.at(-1)!.id : null };
      });
    },
    async update(actor, id, version, input) {
      return db.runTransaction(async (tx) => {
        await administrator(tx, actor);
        const ref = profileRef(actor, id);
        const current = decode(actor, id, (await tx.get(ref)).data());
        if (current.version !== version) throw new ManagementError(409, "Cette fiche a changé. Rechargez-la avant de modifier vos informations.");
        if (current.email !== input.email && (current.authUid || current.invitationUid)) throw new ManagementError(409, "L’e-mail d’un accès créé ou en préparation ne peut pas être modifié ici.");
        if (current.email !== input.email) await emailAvailable(tx, actor, input.email, id);
        const oldEmailLock = current.email !== input.email ? await tx.get(emailRef(actor, current.email)) : null;
        if (current.authUid) linkedMember(actor, current, (await tx.get(memberRef(actor, current.authUid))).data());
        const updated = { ...current, ...input, version: current.version + 1, updatedAt: Date.now() };
        if (current.email !== input.email) { if (oldEmailLock?.data()?.clientId === id) tx.delete(emailRef(actor, current.email)); tx.set(emailRef(actor, input.email), { clientId: id }); }
        tx.update(ref, { ...updated, searchPrefixes: clientSearchPrefixes(input), updatedBy: actor.uid });
        if (current.authUid) tx.update(memberRef(actor, current.authUid), { name: input.name });
        return updated;
      });
    },
    async reserveInvitation(actor, id) {
      return db.runTransaction(async (tx) => {
        await administrator(tx, actor);
        const ref = profileRef(actor, id);
        const profile = decode(actor, id, (await tx.get(ref)).data());
        if (profile.status !== "active") throw new ManagementError(409, "Activez la fiche avant de préparer une invitation.");
        if (profile.authUid) {
          if (!linkedMember(actor, profile, (await tx.get(memberRef(actor, profile.authUid))).data()).active) throw new AccessError(403);
          return profile;
        }
        if (profile.invitationUid) return profile;
        const invitationUid = `pc_${createHash("sha256").update(`${actor.centerId}/${id}`).digest("hex")}`;
        const updated = { ...profile, invitationUid, updatedAt: Date.now() };
        tx.update(ref, { invitationUid, updatedAt: updated.updatedAt, updatedBy: actor.uid });
        return updated;
      });
    },
    async releaseInvitation(actor, id, uid) {
      await db.runTransaction(async (tx) => {
        await administrator(tx, actor);
        const ref = profileRef(actor, id);
        const profile = decode(actor, id, (await tx.get(ref)).data());
        if (!profile.authUid && profile.invitationUid === uid) tx.update(ref, { invitationUid: null, updatedAt: Date.now(), updatedBy: actor.uid });
      });
    },
    async link(actor, id, uid) {
      await db.runTransaction(async (tx) => {
        await administrator(tx, actor);
        const ref = profileRef(actor, id);
        const profile = decode(actor, id, (await tx.get(ref)).data());
        if (profile.status !== "active") throw new ManagementError(409, "La fiche est devenue inactive. Aucune invitation n’est émise.");
        const member = await tx.get(memberRef(actor, uid));
        if (profile.authUid) {
          if (profile.authUid !== uid || !linkedMember(actor, profile, member.data()).active) throw new AccessError(403);
          return;
        }
        if (profile.invitationUid !== uid || member.exists) throw new AccessError(403);
        tx.create(member.ref, { uid, clientId: id, centerId: actor.centerId, role: "client", active: true, email: profile.email, name: profile.name, createdAt: Date.now(), createdBy: actor.uid });
        tx.update(ref, { authUid: uid, invitationUid: null, updatedAt: Date.now(), updatedBy: actor.uid });
      });
    },
  };
}
