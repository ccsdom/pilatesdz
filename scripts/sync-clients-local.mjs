import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { localEnv } from "./local-env.mjs";
import { clientInputSchema, clientSearchPrefixes } from "../src/domain/models/client.ts";

export async function syncClientsLocal() {
  if (process.env.NODE_ENV === "production") throw new Error("Local demo only.");
  Object.assign(process.env, localEnv());
  const { initializeApp, deleteApp } = await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");
  const { getFirestore } = await import("firebase-admin/firestore");
  const app = initializeApp({ projectId: "demo-pilates-center-alger" }, "sync-clients-local");
  let created = 0;
  try {
    const db = getFirestore(app);
    const members = await db.collection("centers/alger/members").where("role", "==", "client").get();
    for (const snapshot of members.docs) {
      const identity = await getAuth(app).getUser(snapshot.id);
      await db.runTransaction(async (tx) => {
        const member = (await tx.get(snapshot.ref)).data();
        if (!member || member.uid !== snapshot.id || member.centerId !== "alger" || member.role !== "client" || typeof member.active !== "boolean") throw new Error(`Invalid membership: ${snapshot.id}`);
        const id = member.clientId ?? snapshot.id;
        if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw new Error("Invalid client id");
        const ref = db.doc(`centers/alger/clients/${id}`);
        const existing = (await tx.get(ref)).data();
        if (existing && (existing.id !== id || existing.centerId !== "alger" || existing.authUid !== snapshot.id)) throw new Error(`Conflicting profile: ${id}`);
        const input = clientInputSchema.parse(existing ? { name: existing.name, email: existing.email, phone: existing.phone, status: existing.status } : {
          name: member.name || identity.displayName || (snapshot.id === "demo-client-alger" ? "Cliente démo" : identity.email),
          email: identity.email, phone: "", status: "active",
        });
        if (input.email !== identity.email?.toLowerCase()) throw new Error(`Profile and identity emails differ: ${id}`);
        const emailRef = db.doc(`centers/alger/clientEmails/${createHash("sha256").update(input.email).digest("hex")}`);
        const indexed = (await tx.get(emailRef)).data();
        if (indexed && indexed.clientId !== id) throw new Error(`Duplicate profile email: ${id}`);
        if (!existing) {
          const now = Date.now();
          tx.create(ref, { ...input, id, centerId: "alger", authUid: snapshot.id, invitationUid: null, version: 1, createdAt: now, updatedAt: now, createdBy: "local-sync", updatedBy: "local-sync", searchPrefixes: clientSearchPrefixes(input) });
        }
        if (!indexed) tx.create(emailRef, { clientId: id });
        tx.update(snapshot.ref, { clientId: id, email: input.email, name: input.name });
      });
      created++;
    }
    console.log(`${created} accès cliente(s) relié(s) à leur fiche locale. Mots de passe et états d’accès conservés.`);
  } finally { await deleteApp(app); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await syncClientsLocal();
