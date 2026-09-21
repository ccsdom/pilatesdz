import { randomBytes, randomUUID } from "node:crypto";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { initializeApp, deleteApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
vi.mock("server-only", () => ({}));
import { settlementRepository } from "../../src/repositories/firestore/credit-settlement";

const origin = "http://127.0.0.1:3102";
let app: App;
const cookies: Record<string, string> = {};
const actor = { uid: "credit-it-admin", centerId: "alger", role: "admin" as const };
const clientId = "credit-it-client";
const root = "centers/alger";
const request = (path: string, cookie = cookies.admin, body?: object, requestOrigin = origin) => fetch(origin + path, {
  method: body ? "POST" : "GET", headers: { Cookie: cookie, Origin: requestOrigin, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}),
});
const decide = (id: string, version = 0, state = "consumed", requestId = randomUUID()) => ({ action: "decide", id, clientId, version, state, requestId, reason: "Décision de test justifiée" });
async function fixture(legacy = false, automatic = false) {
  const db = getFirestore(app), id = randomUUID(), packId = randomUUID();
  await db.doc(`${root}/sessions/${id}`).set({ id, centerId: "alger", title: "Créneau test", instructor: "Studio", startsAt: Date.now() - 7200000, durationMinutes: 60, capacity: 4, bookedCount: 1, status: "scheduled" });
  await db.doc(`${root}/clients/${clientId}/packages/${packId}`).set({ id: packId, centerId: "alger", clientId, label: "Forfait test", credits: 10, remaining: 9, reserved: legacy ? 0 : 1, validFrom: Date.now() - 86400000, expiresAt: Date.now() + 86400000, assignedAt: Date.now() });
  await db.doc(`${root}/sessions/${id}/bookings/${clientId}`).set({ centerId: "alger", sessionId: id, clientId, status: "confirmed", creditPackageId: packId, creditRevision: 1, creditRefunded: false, ...(legacy ? {} : { creditState: "reserved", creditDecisionVersion: 0, settlementMode: automatic ? "automatic" : "manual" }) });
  if (!legacy) await db.doc(`${root}/pendingCreditDecisions/${id}_${clientId}`).set({ sessionId: id, clientId, endsAt: Date.now() - 3600000 });
  if (automatic) await db.doc(`${root}/automaticCreditJobs/${id}_${clientId}`).set({ sessionId: id, clientId, dueAt: Date.now() - 3600000 });
  return { id, pack: db.doc(`${root}/clients/${clientId}/packages/${packId}`), booking: db.doc(`${root}/sessions/${id}/bookings/${clientId}`) };
}
beforeAll(async () => {
  if (process.env.AUTH_TEST_ORIGIN !== origin || process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8082" || process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9098") throw new Error("Use emulator runner");
  app = initializeApp({ projectId: "demo-pilates-center-alger" }, "credit-http-tests");
  const password = randomBytes(24).toString("base64url");
  for (const role of ["admin", "client", "other"] as const) {
    const uid = `credit-it-${role}`, email = `${uid}@pilates.test`, memberRole = role === "admin" ? "admin" : "client";
    await getAuth(app).createUser({ uid, email, password });
    await getFirestore(app).doc(`${root}/members/${uid}`).set({ uid, centerId: "alger", role: memberRole, active: true, clientId: uid });
    await getFirestore(app).doc(`${root}/clients/${uid}`).set({ id: uid, centerId: "alger", authUid: uid, status: "active", name: "Test cliente", email, phone: "", version: 1, createdAt: Date.now(), updatedAt: Date.now() });
    const login = await fetch("http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
    const response = await request("/api/auth/session", "", { idToken: (await login.json()).idToken });
    expect(response.status).toBe(200); cookies[role] = response.headers.get("set-cookie")!.split(";")[0];
  }
});
afterAll(async () => { if (app) await deleteApp(app); });

it("authorizes only active managers, rejects CSRF and waits until the slot ends", async () => {
  const { id } = await fixture();
  expect((await request("/api/crm/credits", "", decide(id))).status).toBe(401);
  expect((await request("/api/crm/credits", cookies.client, decide(id))).status).toBe(403);
  expect((await request("/api/crm/credits", cookies.admin, decide(id), "https://evil.test")).status).toBe(403);
  await getFirestore(app).doc(`${root}/sessions/${id}`).update({ startsAt: Date.now() + 3600000 });
  expect((await request("/api/crm/credits", cookies.admin, decide(id))).status).toBe(409);
});
it("consumes once under duplicate requests and audits reversible corrections", async () => {
  const { id, pack, booking } = await fixture();
  const input = decide(id);
  const responses = await Promise.all([request("/api/crm/credits", cookies.admin, input), request("/api/crm/credits", cookies.admin, input)]);
  expect(responses.map(r => r.status)).toEqual([200, 200]);
  expect((await pack.get()).data()).toMatchObject({ remaining: 9, reserved: 0 });
  expect((await booking.collection("creditDecisions").get()).size).toBe(1);
  expect((await request("/api/crm/credits", cookies.admin, decide(id, 0, "refunded"))).status).toBe(409);
  expect((await request("/api/crm/credits", cookies.admin, decide(id, 1, "refunded"))).status).toBe(200);
  expect((await pack.get()).data()).toMatchObject({ remaining: 10, reserved: 0 });
  expect((await request("/api/crm/credits", cookies.admin, decide(id, 2))).status).toBe(200);
  expect((await pack.get()).data()).toMatchObject({ remaining: 9, reserved: 0 });
  expect((await booking.collection("creditDecisions").get()).size).toBe(3);
});
it("does not debit historical reservations again", async () => {
  const { id, pack } = await fixture(true);
  expect((await request("/api/crm/credits", cookies.admin, decide(id))).status).toBe(200);
  expect((await pack.get()).data()?.remaining).toBe(9);
});
it("processes automatic holds independently of page visits without inventing attendance", async () => {
  const automatic = await fixture(false, true), manual = await fixture();
  const repository = settlementRepository(getFirestore(app));
  await repository.runAutomatic("alger");
  await repository.runAutomatic("alger");
  expect((await automatic.pack.get()).data()).toMatchObject({ remaining: 9, reserved: 0 });
  expect((await automatic.booking.get()).data()?.creditState).toBe("consumed");
  expect((await automatic.booking.get()).data()?.attendance).toBeUndefined();
  expect((await manual.pack.get()).data()?.reserved).toBe(1);
  expect((await automatic.booking.collection("creditDecisions").get()).size).toBe(1);
});
it("never settles a future slot and serializes an automatic/manual race", async () => {
  const db = getFirestore(app), repository = settlementRepository(db);
  const future = await fixture(false, true);
  await db.doc(`${root}/sessions/${future.id}`).update({ startsAt: Date.now() + 3600000 });
  await repository.runAutomatic("alger");
  expect((await future.pack.get()).data()?.reserved).toBe(1);
  expect((await future.booking.collection("creditDecisions").get()).size).toBe(0);
  const race = await fixture(false, true);
  const [, manual] = await Promise.all([repository.runAutomatic("alger"), request("/api/crm/credits", cookies.admin, decide(race.id, 0, "refunded"))]);
  expect([200, 409]).toContain(manual.status);
  const booking = (await race.booking.get()).data()!;
  expect((await race.pack.get()).data()).toMatchObject({ reserved: 0, remaining: booking.creditState === "refunded" ? 10 : 9 });
  expect((await race.booking.collection("creditDecisions").get()).size).toBe(1);
});
it("requires a recent worker heartbeat and guards concurrent policy edits", async () => {
  const db = getFirestore(app), repository = settlementRepository(db);
  await db.doc(`${root}/settings/creditWorker`).delete();
  const initial = await repository.settings(actor);
  expect(initial.automationReady).toBe(false);
  await expect(repository.setMode(actor, "automatic", initial.version)).rejects.toMatchObject({ status: 409 });
  await repository.runAutomatic("alger");
  const updated = await repository.setMode(actor, "automatic", initial.version);
  await expect(repository.setMode(actor, "manual", initial.version)).rejects.toMatchObject({ status: 409 });
  await repository.setMode(actor, "manual", updated.version);
});
it("holds a credit on booking and releases it together with both queues on cancellation", async () => {
  const repository = settlementRepository(getFirestore(app));
  await repository.runAutomatic("alger");
  const initial = await repository.settings(actor);
  const policy = await repository.setMode(actor, "automatic", initial.version);
  const { id, pack, booking } = await fixture();
  await booking.delete();
  await pack.update({ remaining: 10, reserved: 0 });
  await getFirestore(app).doc(`${root}/sessions/${id}`).update({ startsAt: Date.now() + 3600000, bookedCount: 0 });
  expect((await request("/api/planning", cookies.client, { action: "book", id })).status).toBe(200);
  expect((await getFirestore(app).doc(`${root}/automaticCreditJobs/${id}_${clientId}`).get()).exists).toBe(true);
  await repository.setMode(actor, "manual", policy.version);
  // The booking may select another valid test package, so inspect its actual source.
  const source = (await booking.get()).data()!;
  const sourcePack = getFirestore(app).doc(`${root}/clients/${clientId}/packages/${source.creditPackageId}`);
  const before = (await sourcePack.get()).data()!;
  expect(source.creditState).toBe("reserved");
  expect(before.reserved).toBeGreaterThan(0);
  expect((await request("/api/planning", cookies.client, { action: "cancel-booking", id })).status).toBe(200);
  expect((await sourcePack.get()).data()).toMatchObject({ remaining: before.remaining + 1, reserved: before.reserved - 1 });
  expect((await getFirestore(app).doc(`${root}/pendingCreditDecisions/${id}_${clientId}`).get()).exists).toBe(false);
  expect((await getFirestore(app).doc(`${root}/automaticCreditJobs/${id}_${clientId}`).get()).exists).toBe(false);
});
it("paginates only the signed-in client's measurements and hides administrative metadata", async () => {
  const db = getFirestore(app);
  for (let day = 1; day <= 26; day++) {
    const date = `2026-08-${String(day).padStart(2, "0")}`;
    await db.doc(`${root}/clients/${clientId}/measurements/${date}`).set({ day: date, centerId: "alger", clientId, values: { waist: 80 + day / 10 }, updatedBy: "PRIVATE_AUDIT", reason: "PRIVATE_NOTE" });
  }
  expect((await request("/api/mensurations", "")).status).toBe(401);
  expect((await request(`/api/mensurations?clientId=${clientId}`, cookies.other)).status).toBe(400);
  expect((await request("/api/mensurations", cookies.client, { values: { weight: 50 } })).status).toBe(405);
  const response = await request("/api/mensurations", cookies.client);
  expect(response.headers.get("cache-control")).toBe("no-store");
  const first = await response.json();
  expect(first.measurements).toHaveLength(25);
  expect(JSON.stringify(first)).not.toMatch(/PRIVATE_|clientId|updatedBy/);
  const second = await (await request(`/api/mensurations?after=${first.next}`, cookies.client)).json();
  expect(second.measurements).toHaveLength(1); expect(second.next).toBeNull();
  expect((await (await request("/api/mensurations", cookies.other)).json()).measurements).toEqual([]);
  await db.doc(`${root}/members/credit-it-other`).update({ clientId });
  expect((await request("/api/mensurations", cookies.other)).status).toBe(403);
  await db.doc(`${root}/members/credit-it-other`).update({ clientId: "credit-it-other" });
  const html = await (await request("/espace-cliente/mensurations", cookies.client)).text();
  expect(html).toContain("Mes mensurations"); expect(html).not.toContain("PRIVATE_AUDIT");
});
