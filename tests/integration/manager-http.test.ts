import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, expect, it } from "vitest";
import { initializeApp, deleteApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { studioDay, parseStudioDateTime } from "../../src/domain/models/planning";

const origin = "http://127.0.0.1:3102";
let app: App, admin: string, manager: string, managerUid: string, clientId: string;
const password = randomUUID();
const call = (path: string, cookie: string, body?: object) => fetch(origin + path, { method: body ? "POST" : "GET", headers: { Cookie: cookie, Origin: origin, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
async function login(email: string) {
  const r = await fetch("http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
  const session = await call("/api/auth/session", "", { idToken: (await r.json()).idToken });
  expect(session.status).toBe(200); expect((await session.json()).destination).toBe("/crm");
  return session.headers.get("set-cookie")!.split(";")[0];
}
beforeAll(async () => {
  if (process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8082" || process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9098") throw new Error("Emulators required");
  app = initializeApp({ projectId: "demo-pilates-center-alger" }, "manager-tests");
  await getAuth(app).createUser({ uid: "manager-test-admin", email: "manager-admin@example.test", password });
  await getFirestore(app).doc("centers/alger/members/manager-test-admin").set({ uid: "manager-test-admin", centerId: "alger", role: "admin", active: true });
  admin = await login("manager-admin@example.test");
});
afterAll(async () => { if (app) await deleteApp(app); });

it("provisions a manager once, without a customer profile, and routes the session to the CRM", async () => {
  const body = { action: "invite-manager", email: "manager-role@example.test", name: "Manager QA" };
  expect((await call("/api/crm/acces", "", body)).status).toBe(401);
  const first = await call("/api/crm/acces", admin, body); expect(first.status).toBe(201);
  managerUid = (await first.json()).uid;
  expect((await (await call("/api/crm/acces", admin, body)).json()).uid).toBe(managerUid);
  const db = getFirestore(app);
  expect((await db.doc(`centers/alger/members/${managerUid}`).get()).data()).toMatchObject({ role: "manager", active: true });
  expect((await db.collection("centers/alger/clients").where("email", "==", body.email).get()).empty).toBe(true);
  await getAuth(app).updateUser(managerUid, { password });
  manager = await login(body.email);
  const page = await (await call("/crm", manager)).text();
  expect(page).toContain("Tableau de bord"); expect(page).toContain("Manager");
  expect(page).not.toContain('href="/crm/acces"');
});

it("denies account management and client invitations to managers, including role injection", async () => {
  for (const body of [{ action: "invite-manager", name: "Other", email: "other-manager@example.test" }, { action: "invite", name: "Client", email: "client-manager@example.test" }, { action: "deactivate", uid: "manager-test-admin" }, { action: "reactivate", uid: managerUid }, { action: "invitation", uid: managerUid }]) expect((await call("/api/crm/acces", manager, body)).status).toBe(403);
  expect(await (await call("/crm/acces", manager)).text()).toContain("Accès non autorisé");
  expect((await call("/api/crm/acces", admin, { action: "invite-manager", name: "Injected", email: "injected@example.test", role: "admin" })).status).toBe(400);
  const response = await call("/api/crm/clientes", manager, { action: "create", profile: { name: "Client Manager QA", email: "managed-client@example.test", phone: "0777720001", status: "active" } });
  expect(response.status).toBe(201); clientId = (await response.json()).profile.id;
  expect((await call("/api/crm/clientes", manager, { action: "invite", id: clientId })).status).toBe(403);
});

it("allows manager subscriptions, cash, corrections, measurements and operational reports", async () => {
  const subscriptionId = randomUUID();
  expect((await call("/api/abonnements", manager, { requestId: subscriptionId, clientId, subscription: { offerId: "monthly-4", term: "monthly", purchaseDate: studioDay() } })).status).toBe(201);
  const paymentId = randomUUID();
  expect((await call("/api/encaissements", manager, { requestId: paymentId, clientId, subscriptionId, payment: { amountMinor: 500000, method: "cash", receivedDate: studioDay() } })).status).toBe(201);
  expect((await call("/api/encaissements/corrections", manager, { requestId: randomUUID(), clientId, subscriptionId, correction: { paymentId, reason: "Correction de recette" } })).status).toBe(201);
  expect((await call("/api/crm/mensurations", manager, { clientId, version: 0, measurement: { day: studioDay(), values: { weight: 60 } } })).status).toBe(200);
  for (const path of [`/api/forfaits?clientId=${clientId}`, `/api/abonnements?clientId=${clientId}`, `/api/historique?clientId=${clientId}&month=${studioDay().slice(0,7)}`, `/api/crm/mensurations?clientId=${clientId}`, "/api/crm/credits", "/api/crm/reservations", "/api/encaissements/soldes", `/api/encaissements/rapport?month=${studioDay().slice(0,7)}`, `/api/forfaits/suivi`]) expect((await call(path, manager)).status, path).toBe(200);
});

it("allows manager booking, attendance and credit decisions with the real manager as author", async () => {
  const db = getFirestore(app), sessionId = randomUUID();
  expect((await call("/api/planning", manager, { action: "create", requestId: sessionId, session: { title: "Manager QA", instructor: "Coach", startsAt: parseStudioDateTime(`${studioDay(Date.now() + 86400000)}T01:00`), durationMinutes: 60, capacity: 4 } })).status).toBe(201);
  expect((await call("/api/planning", manager, { action: "book-client", id: sessionId, clientId })).status).toBe(200);
  expect((await call(`/api/planning?id=${sessionId}`, manager)).status).toBe(200);
  await db.doc(`centers/alger/sessions/${sessionId}`).update({ startsAt: Date.now()-7200000 });
  expect((await call("/api/presences", manager, { id: sessionId, clientId, status: "present", requestId: randomUUID(), version: 0, reason: "Présence de recette" })).status).toBe(200);
  expect((await call("/api/crm/credits", manager, { action: "decide", id: sessionId, clientId, version: 0, state: "consumed", requestId: randomUUID(), reason: "Séance de recette terminée" })).status).toBe(200);
  const events = await db.collection(`centers/alger/sessions/${sessionId}/bookings/${clientId}/creditDecisions`).get();
  expect(events.size).toBe(1);
  expect(events.docs[0].data().actorUid).toBe(managerUid);
});

it("immediately blocks a disabled manager, reactivates without promotion and preserves the audit", async () => {
  const input = { uid: managerUid };
  expect((await call("/api/crm/acces", admin, { ...input, action: "deactivate" })).status).toBe(200);
  expect((await call("/api/crm/credits", manager)).status).toBe(403);
  expect((await call("/api/crm/acces", admin, { action: "invite-manager", name: "Manager QA", email: "manager-role@example.test" })).status).toBe(409);
  expect((await call("/api/crm/acces", admin, { ...input, action: "reactivate" })).status).toBe(200);
  expect((await call("/api/crm/credits", manager)).status).toBe(200);
  const ref = getFirestore(app).doc(`centers/alger/members/${managerUid}`);
  expect((await ref.get()).data()?.role).toBe("manager");
  expect((await ref.collection("accessEvents").get()).size).toBe(3);
  await ref.update({ centerId: "oran" });
  expect((await call("/api/crm/credits", manager)).status).toBe(403);
  await ref.update({ centerId: "alger", role: "client" });
  expect((await call("/api/crm/credits", manager)).status).toBe(403);
});


it("reactivates clients only with a valid active linked profile and never takes over an existing account", async () => {
  const db = getFirestore(app);
  const r = await call("/api/crm/acces", admin, { action: "invite", name: "Access Lifecycle", email: "access-lifecycle@example.test" });
  expect(r.status).toBe(201);
  const { uid } = await r.json();
  const member = db.doc(`centers/alger/members/${uid}`);
  const profile = db.doc(`centers/alger/clients/${(await member.get()).data()!.clientId}`);
  expect((await call("/api/crm/acces", admin, { action: "deactivate", uid })).status).toBe(200);
  await profile.update({ status: "inactive" });
  expect((await call("/api/crm/acces", admin, { action: "reactivate", uid })).status).toBe(409);
  await profile.update({ status: "active" });
  await getAuth(app).updateUser(uid, { disabled: true });
  expect((await call("/api/crm/acces", admin, { action: "reactivate", uid })).status).toBe(409);
  await getAuth(app).updateUser(uid, { disabled: false });
  expect((await call("/api/crm/acces", admin, { action: "reactivate", uid })).status).toBe(200);
  expect((await member.get()).data()).toMatchObject({ role: "client", active: true });
  expect((await call("/api/crm/acces", admin, { action: "invite-manager", name: "Access Lifecycle", email: "access-lifecycle@example.test" })).status).toBe(409);
  expect((await member.get()).data()?.role).toBe("client");
});
