import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, afterAll, expect, it } from "vitest";
import { initializeApp, deleteApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { defaultStudioOpening, type StudioOpening } from "../../src/domain/models/studio-opening";
import { studioSlots } from "../../src/domain/models/studio-slots";
const origin = "http://127.0.0.1:3102", day = "2098-01-06";
let app: App;
const cookies: Record<string, string> = {};
const password = randomUUID();
const call = (path: string, role = "manager", body?: object, source = origin) => fetch(origin + path, { method: body ? "POST" : "GET", headers: { Cookie: cookies[role] ?? "", Origin: source, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
const closed = () => ({ ...defaultStudioOpening(), exceptions: [{ day, ranges: [], reason: "Fermeture QA" }] });
const change = (opening: StudioOpening = closed(), expectedVersion = 0, action = "save") => ({ action, opening, effectiveFrom: day, expectedVersion });
const publicBody = () => ({ requestId: randomUUID(), practiceId: "discovery", practiceName: "Découverte", gender: "femme", date: day, slot: "10:00 - 11:00", clientName: "Test horaires", clientPhone: "0777755555", clientLevel: "Débutant", paymentMethod: "studio" });
const sessionId = `pub_${day}_1000_femme`;
async function fixture(id = sessionId, extra: object = {}) {
  const slot = studioSlots(day, "femme")[0];
  await getFirestore(app).doc(`centers/alger/sessions/${id}`).set({ id, centerId: "alger", startsAt: slot.startsAt, durationMinutes: 60, capacity: 4, bookedCount: 0, status: "scheduled", title: "Créneau Femmes", instructor: "Studio", createdBy: "automatic_slots", ...extra });
}
beforeAll(async () => {
  if (process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8082" || process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9098") throw new Error("Emulators required");
  app = initializeApp({ projectId: "demo-pilates-center-alger" }, "opening-tests");
  for (const role of ["admin", "manager", "client"]) {
    const uid = `opening-${role}`, email = `${uid}@example.test`;
    await getAuth(app).createUser({ uid, email, password });
    await getFirestore(app).doc(`centers/alger/members/${uid}`).set({ uid, role, centerId: "alger", active: true, ...(role === "client" ? { clientId: "opening-client" } : {}) });
    const response = await fetch("http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
    const session = await call("/api/auth/session", "none", { idToken: (await response.json()).idToken });
    expect(session.status).toBe(200);
    cookies[role] = session.headers.get("set-cookie")!.split(";")[0];
  }
});
beforeEach(async () => {
  const db = getFirestore(app);
  await db.doc("centers/alger/settings/opening").delete();
  await db.recursiveDelete(db.collection("centers/alger/sessions"));
  await db.recursiveDelete(db.collection("centers/alger/public_contact_claims"));
  await db.recursiveDelete(db.collection("centers/alger/clients"));
  await db.doc("centers/alger/clients/opening-client").set({ id: "opening-client", centerId: "alger", status: "active", authUid: "opening-client", name: "Cliente QA" });
});
afterAll(async () => { if (app) await deleteApp(app); });
it("autorise admin/manager, refuse cliente, visiteur et mauvaise origine", async () => {
  for (const role of ["admin", "manager"]) expect((await call("/api/crm/horaires", role)).status).toBe(200);
  expect((await call("/api/crm/horaires", "client")).status).toBe(403);
  expect((await call("/api/crm/horaires", "none")).status).toBe(401);
  expect((await call("/api/crm/horaires", "client", change())).status).toBe(403);
  expect((await call("/api/crm/horaires", "manager", change(), "https://evil.example")).status).toBe(403);
  expect((await call("/api/crm/horaires", "manager", { ...change(), centerId: "other" })).status).toBe(400);
});
it("refuse les chevauchements et les dates d’effet passées", async () => {
  const opening = defaultStudioOpening();
  opening.week[1].push({ audience: "homme", startMinute: 600, endMinute: 720 });
  expect((await call("/api/crm/horaires", "manager", change(opening))).status).toBe(400);
  expect((await call("/api/crm/horaires", "manager", { ...change(), effectiveFrom: "2020-01-01" })).status).toBe(400);
});
it("bloque une fermeture réservée sans annuler ni modifier un crédit", async () => {
  await fixture(sessionId, { bookedCount: 1 });
  const ref = getFirestore(app).doc(`centers/alger/sessions/${sessionId}`);
  await ref.collection("bookings").doc("opening-client").set({ status: "confirmed", clientId: "opening-client", creditState: "reserved" });
  const preview = await call("/api/crm/horaires", "manager", change(closed(), 0, "preview"));
  expect(preview.status).toBe(200); expect((await preview.json()).conflicts).toHaveLength(1);
  expect((await call("/api/crm/horaires", "manager", change())).status).toBe(409);
  expect((await ref.get()).data()).toMatchObject({ status: "scheduled", bookedCount: 1 });
  expect((await ref.collection("bookings").doc("opening-client").get()).data()?.creditState).toBe("reserved");
});
it("ferme puis rouvre uniquement les créneaux automatiques vides, conserve les historiques et les annulations", async () => {
  await fixture(); await fixture("manual", { createdBy: "opening-manager", startsAt: studioSlots(day, "femme")[0].startsAt + 10 * 3600000 });
  const cancelledId = `pub_${day}_1100_femme`;
  await fixture(cancelledId, { status: "cancelled", startsAt: studioSlots(day, "femme")[1].startsAt });
  const db = getFirestore(app), ref = db.doc(`centers/alger/sessions/${sessionId}`);
  await ref.collection("bookings").doc("old").set({ status: "cancelled" });
  await db.doc("centers/other/sessions/test").set({ status: "scheduled" });
  const result = await call("/api/crm/horaires", "manager", change());
  expect(result.status).toBe(200); expect(await result.json()).toMatchObject({ closing: 1, manual: 1, version: 1 });
  expect((await ref.get()).data()?.openingClosed).toBe(true);
  expect((await call("/api/planning", "client", { action: "book", id: sessionId })).status).toBe(409);
  expect((await call("/api/reservation", "none", publicBody())).status).toBe(409);
  expect((await (await call(`/api/disponibilites?day=${day}&audience=femme`, "none")).json()).slots).toEqual([]);
  expect((await call("/api/crm/horaires", "manager", change(defaultStudioOpening(), 1))).status).toBe(200);
  expect((await ref.get()).data()?.openingClosed).toBe(false);
  expect((await ref.collection("bookings").doc("old").get()).exists).toBe(true);
  expect((await db.doc(`centers/alger/sessions/${cancelledId}`).get()).data()?.status).toBe("cancelled");
  expect((await db.doc("centers/alger/sessions/manual").get()).data()?.openingClosed).toBeUndefined();
  expect((await db.doc("centers/other/sessions/test").get()).data()).toEqual({ status: "scheduled" });
});
it("ouvre exceptionnellement le vendredi et ne publie pas les identités des managers", async () => {
  const opening = defaultStudioOpening();
  opening.exceptions.push({ day: "2098-01-10", ranges: [{ audience: "femme", startMinute: 600, endMinute: 660 }], reason: "Ouverture" });
  expect((await call("/api/crm/horaires", "manager", change(opening))).status).toBe(200);
  const slots = await (await call("/api/disponibilites?day=2098-01-10&audience=femme", "none")).json();
  expect(slots.slots).toHaveLength(1);
  const published = await (await call("/api/horaires", "none")).json();
  expect(JSON.stringify(published)).not.toContain("updatedBy");
  expect(JSON.stringify(published)).not.toContain("opening-manager");
});
it("une seule sauvegarde concurrente de la même version gagne", async () => {
  const results = await Promise.all([call("/api/crm/horaires", "manager", change()), call("/api/crm/horaires", "admin", change())]);
  expect(results.map(r => r.status).sort()).toEqual([200, 409]);
});
it("ne rouvre pas un créneau vide si une séance manuelle occupe désormais l’heure", async () => {
  await fixture();
  expect((await call("/api/crm/horaires", "manager", change())).status).toBe(200);
  await fixture("manual", { createdBy: "opening-manager" });
  expect((await call("/api/crm/horaires", "manager", change(defaultStudioOpening(), 1))).status).toBe(200);
  expect((await getFirestore(app).doc(`centers/alger/sessions/${sessionId}`).get()).data()?.openingClosed).toBe(true);
  const availability = await (await call(`/api/disponibilites?day=${day}&audience=femme`, "none")).json();
  expect(availability.slots[0].available).toBe(0);
});
it("une réservation concurrente et une fermeture ne peuvent pas réussir toutes les deux", async () => {
  const [closing, booking] = await Promise.all([call("/api/crm/horaires", "manager", change()), call("/api/reservation", "none", publicBody())]);
  expect([closing.status, booking.status]).toSatisfy((statuses: number[]) => (statuses[0] === 200 && statuses[1] === 409) || (statuses[0] === 409 && statuses[1] === 201));
});
