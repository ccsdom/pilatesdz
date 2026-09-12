import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { localEnv } from "./local-env.mjs";

if (process.env.NODE_ENV === "production") throw new Error("Local demo only.");
Object.assign(process.env, localEnv());
const { initializeApp, deleteApp } = await import("firebase-admin/app");
const { getAuth } = await import("firebase-admin/auth");
const { getFirestore } = await import("firebase-admin/firestore");
const app = initializeApp({ projectId: "demo-pilates-center-alger" });
try {
  const accounts = [];
  for (const role of ["admin", "client"]) {
    const uid = `demo-${role}-alger`;
    const email = `${role}@pilates.test`;
    const password = randomBytes(18).toString("base64url");
    let exists = true;
    try { await getAuth(app).getUser(uid); }
    catch (error) { if (error.code === "auth/user-not-found") exists = false; else throw error; }
    if (exists) {
      await getAuth(app).updateUser(uid, { email, password, disabled: false, emailVerified: true });
      await getAuth(app).revokeRefreshTokens(uid);
    } else { await getAuth(app).createUser({ uid, email, password, emailVerified: true }); }
    await getFirestore(app).doc(`centers/alger/members/${uid}`).set({ uid, centerId: "alger", role, active: true, email, name: role === "admin" ? "Administration démo" : "Cliente démo" }, { merge: true });
    accounts.push({ role, email, password });
  }
  mkdirSync(".firebase", { recursive: true });
  writeFileSync(".firebase/demo-accounts.json", JSON.stringify(accounts, null, 2) + "\n");
  console.log("Deux comptes fictifs prêts. Identifiants locaux : .firebase/demo-accounts.json (ignoré par Git).");
} finally { await deleteApp(app); }
const { syncClientsLocal } = await import("./sync-clients-local.mjs");
await syncClientsLocal();
