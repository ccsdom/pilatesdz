import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, expect, it } from "vitest";
import { initializeApp, deleteApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const origin = "http://127.0.0.1:3102";
const date = "2098-01-06"; // Monday, isolated from other fixtures.
let app: App;
const bodies = Array.from({ length: 5 }, (_, i) => ({ requestId: randomUUID(), practiceId: "discovery", practiceName: "Ignored client label", gender: "femme", date, slot: "10:00 - 11:00", clientName: `Public test ${i}`, clientPhone: `077770000${i}`, clientEmail: `public-slot-${i}@example.test`, clientLevel: "Débutant", paymentMethod: "studio" }));
const post = (body: object, requestOrigin = origin) => fetch(`${origin}/api/reservation`, { method: "POST", headers: { "Content-Type": "application/json", Origin: requestOrigin }, body: JSON.stringify(body) });
const availability = () => fetch(`${origin}/api/disponibilites?day=${date}&audience=femme`);
beforeAll(() => {
  if (process.env.AUTH_TEST_ORIGIN !== origin || process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8082") throw new Error("Emulators required");
  app = initializeApp({ projectId: "demo-pilates-center-alger" }, "public-slots-tests");
});
afterAll(async () => { if (app) await deleteApp(app); });

it("creates a real linked Auth account and resumes an interrupted provisioning without a second booking", async () => {
  const body = { ...bodies[0], requestId: randomUUID(), clientEmail: "activation-retry@example.test", clientPhone: "0777710001", slot: "12:00 - 13:00" };
  // An unrelated existing Auth account must never be taken over.
  const unrelated = await getAuth(app).createUser({ email: body.clientEmail });
  const first = await post(body); expect(first.status).toBe(201);
  expect(await first.json()).toMatchObject({ accessStatus: "pending", emailAccepted: false, invitationUrl: null });
  const db = getFirestore(app);
  const receiptRef = db.doc(`centers/alger/public_reservations/${body.requestId}`);
  const receipt = (await receiptRef.get()).data()!;
  const profileRef = db.doc(`centers/alger/clients/${receipt.clientId}`);
  const pending = (await profileRef.get()).data()!;
  expect(pending.authUid).toBeNull(); expect(pending.invitationUid).toBeTruthy();
  expect((await db.doc(`centers/alger/members/${pending.invitationUid}`).get()).exists).toBe(false);
  // Remove the conflict in the emulator only, then replay the same booking request.
  await getAuth(app).deleteUser(unrelated.uid);
  const retry = await post(body); expect(retry.status).toBe(201);
  const result = await retry.json();
  expect(result).toMatchObject({ accessStatus: "ready", emailAccepted: false, reservationId: body.requestId });
  expect(result.invitationUrl).toContain("/connexion/mot-de-passe#");
  const linked = (await profileRef.get()).data()!;
  expect(linked.authUid).toBe(pending.invitationUid); expect(linked.invitationUid).toBeNull();
  expect((await getAuth(app).getUser(linked.authUid)).email).toBe(body.clientEmail);
  const memberRef = db.doc(`centers/alger/members/${linked.authUid}`);
  expect((await memberRef.get()).data()).toMatchObject({ active: true, role: "client", clientId: receipt.clientId });
  const session = db.doc(`centers/alger/sessions/${receipt.sessionId}`);
  expect((await session.get()).data()?.bookedCount).toBe(1);
  expect((await session.collection("bookings").get()).size).toBe(1);
  await memberRef.update({ active: false });
  expect(await (await post(body)).json()).toMatchObject({ accessStatus: "pending", invitationUrl: null });
  expect((await memberRef.get()).data()?.active).toBe(false);
});

it("confirms a phone-only booking without inventing an Auth account or email delivery", async () => {
  const { clientEmail: _email, ...base } = bodies[0];
  void _email;
  const body = { ...base, requestId: randomUUID(), clientPhone: "0777710002", slot: "13:00 - 14:00" };
  const response = await post(body); expect(response.status).toBe(201);
  expect(await response.json()).toMatchObject({ accessStatus: "no-email", emailAccepted: false, invitationUrl: null });
  const db = getFirestore(app);
  const receipt = (await db.doc(`centers/alger/public_reservations/${body.requestId}`).get()).data()!;
  const profile = (await db.doc(`centers/alger/clients/${receipt.clientId}`).get()).data()!;
  expect(profile).toMatchObject({ authUid: null, invitationUid: null });
  await expect(getAuth(app).getUserByEmail(profile.email)).rejects.toMatchObject({ code: "auth/user-not-found" });
  expect(await (await post(body)).json()).toMatchObject({ accessStatus: "no-email" });
});

it("limits five simultaneous first visits to four places, atomically and idempotently", async () => {
  const before = await availability();
  expect(before.status).toBe(200);
  expect((await before.json()).slots[0].available).toBe(4);
  const responses = await Promise.all(bodies.map(body => post(body)));
  expect(responses.filter(response => response.status === 201)).toHaveLength(4);
  expect(responses.filter(response => response.status === 409)).toHaveLength(1);
  const winner = bodies[responses.findIndex(response => response.status === 201)];
  const repeated = await post(winner);
  expect(repeated.status).toBe(201);
  const receipt = await repeated.json();
  expect(receipt.reservationId).toBe(winner.requestId);
  const db = getFirestore(app);
  const session = db.doc(`centers/alger/sessions/pub_${date}_1000_femme`);
  expect((await session.get()).data()?.bookedCount).toBe(4);
  expect((await session.collection("bookings").get()).size).toBe(4);
  const failedBody = bodies[responses.findIndex(response => response.status === 409)];
  expect((await db.collection("centers/alger/clients").where("email", "==", failedBody.clientEmail).get()).empty).toBe(true);
  const result = await (await availability()).json();
  expect(result.slots[0].available).toBe(0);
  expect(JSON.stringify(result)).not.toContain("clientName");
  expect(JSON.stringify(result)).not.toContain("clientEmail");
  const record = (await db.doc(`centers/alger/public_reservations/${winner.requestId}`).get()).data();
  expect(record?.priceDzd).toBe(2500);
  expect(record?.practiceName).toBe("Séance découverte");
  expect((await post({ ...winner, requestId: randomUUID(), slot: "11:00 - 12:00" })).status).toBe(409);
  expect((await post({ ...winner, clientName: "Changed" })).status).toBe(409);
  await session.update({ bookedCount: 3 });
  expect((await (await availability()).json()).slots[0].available).toBe(1);
  await session.update({ status: "cancelled", bookedCount: 0 });
  expect((await (await availability()).json()).slots[0].available).toBe(0);
});
it("rejects forged hours, invalid dates, unauthenticated credits and foreign origins", async () => {
  // Closed hours are a conflict with the current manager configuration.
  expect((await post({ ...bodies[0], slot: "03:00 - 04:00" })).status).toBe(409);
  expect((await post({ ...bodies[0], date: "2098-02-30" })).status).toBe(400);
  expect((await post({ ...bodies[0], paymentMethod: "credit" })).status).toBe(400);
  expect((await post(bodies[0], "https://evil.test")).status).toBe(403);
  expect((await fetch(`${origin}/api/disponibilites?day=invalid&audience=femme`)).status).toBe(400);
});

it("prepares automatic slots for authenticated clients using the same public availability", async () => {
  const db = getFirestore(app);
  const uid = "automatic-slot-client";
  const email = "automatic-slot-client@example.test";
  const password = randomUUID();
  await getAuth(app).createUser({ uid, email, password });
  await db.doc(`centers/alger/members/${uid}`).set({ uid, centerId: "alger", role: "client", active: true, clientId: uid });
  await db.doc(`centers/alger/clients/${uid}`).set({ id: uid, centerId: "alger", authUid: uid, status: "active" });
  const signIn = await fetch("http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
  const identity = await signIn.json();
  const login = await fetch(`${origin}/api/auth/session`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify({ idToken: identity.idToken }) });
  expect(login.status).toBe(200);
  const cookie = login.headers.get("set-cookie")!.split(";")[0];
  const response = await fetch(`${origin}/api/planning?day=2098-01-07`, { headers: { Cookie: cookie } });
  expect(response.status).toBe(200);
  const page = await response.json();
  expect(page.sessions).toHaveLength(10);
  expect(page.sessions.every((item: { session: { capacity: number; durationMinutes: number } }) => item.session.capacity === 4 && item.session.durationMinutes === 60)).toBe(true);
  const second = await fetch(`${origin}/api/planning?day=2098-01-07`, { headers: { Cookie: cookie } });
  expect((await second.json()).sessions).toHaveLength(10);
  const publicResponse = await fetch(`${origin}/api/disponibilites?day=2098-01-07&audience=femme`);
  const publicPage = await publicResponse.json();
  expect(publicPage.slots).toHaveLength(8);
  expect(publicPage.slots[0].id).toBe(page.sessions[0].session.id);
});
