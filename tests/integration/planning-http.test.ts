import { randomBytes, randomUUID } from "node:crypto";
import { beforeAll, afterAll, expect, it } from "vitest";
import { initializeApp, deleteApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { parseStudioDateTime, studioDay } from "../../src/domain/models/planning";
import { packageDates } from "../../src/domain/models/package";

const origin = "http://127.0.0.1:3102";
let app: App;
const cookies: Record<string, string> = {};
const password = randomBytes(20).toString("base64url");
const day = studioDay(Date.now() + 2 * 86400000);
const data = { title: "Reformer test", instructor: "Coach test", startsAt: parseStudioDateTime(`${day}T10:00`), durationMinutes: 60, capacity: 1 };
function post(body: object, cookie?: string, requestOrigin = origin) {
  return fetch(origin + "/api/planning", { method: "POST", headers: { "Content-Type": "application/json", Origin: requestOrigin, ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
}
function get(query = `?day=${day}`, cookie = cookies.admin) { return fetch(origin + "/api/planning" + query, { headers: cookie ? { Cookie: cookie } : {} }); }
const packageInput = { label: "Forfait test", credits: 50, ...packageDates(studioDay(), studioDay(Date.now() + 30 * 86400000)) };
function assign(key: string, value = packageInput, requestId = randomUUID(), cookie = cookies.admin, requestOrigin = origin) {
  return fetch(origin + "/api/forfaits", { method: "POST", headers: { "Content-Type": "application/json", Origin: requestOrigin, Cookie: cookie }, body: JSON.stringify({ requestId, clientId: `planning-it-${key}`, package: value }) });
}
function packages(key: string, cookie = cookies.admin) { return fetch(origin + `/api/forfaits?clientId=planning-it-${key}`, { headers: { Cookie: cookie } }); }
async function balance(key: string) { return (await (await packages(key)).json()).packages.reduce((sum: number, pack: { remaining: number }) => sum + pack.remaining, 0); }
async function create(capacity = 1) {
  const requestId = randomUUID();
  const response = await post({ action: "create", requestId, session: { ...data, capacity } }, cookies.admin);
  expect(response.status).toBe(201); return (await response.json()).session;
}
beforeAll(async () => {
  if (process.env.AUTH_TEST_ORIGIN !== origin || process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9098" || process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8082") throw new Error("Use pnpm test:auth");
  app = initializeApp({ projectId: "demo-pilates-center-alger" }, "planning-http-tests");
  for (const key of ["admin", "a", "b", "c", "d", "e", "sub", "subrace"]) {
    const uid = `planning-it-${key}`;
    const email = `${uid}@pilates.test`;
    const role = key === "admin" ? "admin" : "client";
    await getAuth(app).createUser({ uid, email, password });
    await getFirestore(app).doc(`centers/alger/members/${uid}`).set({ uid, role, centerId: "alger", active: true, ...(role === "client" ? { clientId: uid } : {}) });
    if (role === "client") await getFirestore(app).doc(`centers/alger/clients/${uid}`).set({ id: uid, centerId: "alger", authUid: uid, invitationUid: null, status: "active", name: `Private client ${key}`, email, phone: "", version: 1, createdAt: Date.now(), updatedAt: Date.now(), searchPrefixes: [] });
    const signIn = await fetch("http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
    const token = (await signIn.json()).idToken;
    const response = await fetch(origin + "/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify({ idToken: token }) });
    expect(response.status).toBe(200); cookies[key] = response.headers.get("set-cookie")!.split(";")[0];
  }
  for (const key of ["a", "b", "c"]) expect((await assign(key)).status).toBe(201);
});
afterAll(async () => { if (app) await deleteApp(app); });

function clientHistory(query: string, cookie = cookies.admin) { return fetch(origin + "/api/historique?" + query, { headers: { Cookie: cookie } }); }
it("renders real whole-day CRM metrics beyond the planning preview and excludes cancelled courses", async () => {
  const startsAt = parseStudioDateTime(`${studioDay()}T12:00`);
  const batch = getFirestore(app).batch();
  for (let i = 0; i < 55; i++) {
    const id = `dashboard-${i}`;
    batch.set(getFirestore(app).doc(`centers/alger/sessions/${id}`), { ...data, id, centerId: "alger", startsAt, capacity: 4, bookedCount: i < 50 ? 2 : 4, status: i < 50 ? "scheduled" : "cancelled" });
  }
  batch.set(getFirestore(app).doc("centers/oran/sessions/dashboard-foreign"), { ...data, id: "dashboard-foreign", centerId: "oran", startsAt, capacity: 4, bookedCount: 4, status: "scheduled" });
  await batch.commit();
  const response = await fetch(origin + "/crm", { headers: { Cookie: cookies.admin } });
  expect(response.status).toBe(200);
  const html = await response.text();
  expect(html).toMatch(/data-testid="dashboard-sessions"[^>]*>50</);
  expect(html).toMatch(/data-testid="dashboard-bookings"[^>]*>100</);
  expect(html).toMatch(/data-testid="dashboard-available"[^>]*>100</);
  expect(html).toMatch(/data-testid="dashboard-occupancy"[^>]*>50 %</);
  expect(html).not.toContain("286 500");
  expect(html).not.toContain("+12,4%");
  const denied = await (await fetch(origin + "/crm", { headers: { Cookie: cookies.sub } })).text();
  expect(denied).toContain("Accès non autorisé");
  expect(denied).not.toContain("dashboard-bookings");
});

it("isolates customer history and rejects unauthorized or malformed requests", async () => {
  expect((await clientHistory("month=2020-02", "")).status).toBe(401);
  expect((await clientHistory("month=2020-02&clientId=planning-it-b", cookies.a)).status).toBe(403);
  expect((await clientHistory("month=2020-02")).status).toBe(400);
  expect((await clientHistory("month=2020-13&clientId=planning-it-a")).status).toBe(400);
  expect((await clientHistory("month=2020-02&clientId=../other")).status).toBe(400);
  expect((await clientHistory("month=2020-02&clientId=missing")).status).toBe(404);
  const member = getFirestore(app).doc("centers/alger/members/planning-it-e");
  await member.update({ active: false });
  expect((await clientHistory("month=2020-02", cookies.e)).status).toBe(403);
  await member.update({ active: true, clientId: "planning-it-a" });
  expect((await clientHistory("month=2020-02", cookies.e)).status).toBe(403);
  await member.update({ clientId: "planning-it-e" });
});
it("includes old bookings and reports complete monthly metrics across pages without notes", async () => {
  const batch = getFirestore(app).batch();
  for (let index = 0; index < 24; index++) {
    const id = `history-${String(index).padStart(2, "0")}`, ref = getFirestore(app).doc(`centers/alger/sessions/${id}`);
    batch.create(ref, { ...data, id, centerId: "alger", status: index === 23 ? "cancelled" : "scheduled", startsAt: parseStudioDateTime("2020-02-15T10:00"), bookedCount: 1 });
    batch.create(ref.collection("bookings").doc("planning-it-a"), { clientId: "planning-it-a", sessionId: id, centerId: "alger", status: index === 22 ? "cancelled" : "confirmed", ...(index < 2 ? { attendance: { status: index === 0 ? "present" : "absent", version: 1 }, privateNote: "ADMIN_NOTE_HIDDEN" } : {}) });
  }
  // Other-center and out-of-month records cannot affect the summary.
  const foreign = getFirestore(app).doc("centers/oran/sessions/history-foreign");
  batch.create(foreign, { ...data, id: "history-foreign", centerId: "oran", startsAt: parseStudioDateTime("2020-02-15T10:00"), status: "scheduled" });
  batch.create(foreign.collection("bookings").doc("planning-it-a"), { clientId: "planning-it-a", centerId: "oran", sessionId: "history-foreign", status: "confirmed" });
  await batch.commit();
  const response = await clientHistory("month=2020-02", cookies.a);
  expect(response.headers.get("cache-control")).toBe("no-store");
  const first = await response.json();
  expect(first.entries).toHaveLength(20);
  expect(first.summary).toMatchObject({ present: 1, absent: 1, unmarked: 20, cancelled: 1, "session-cancelled": 1, attendanceRate: 50 });
  expect(JSON.stringify(first)).not.toContain("ADMIN_NOTE_HIDDEN"); expect(JSON.stringify(first)).not.toContain("planning-it-b");
  const second = await (await clientHistory(`month=2020-02&after=${first.next}`, cookies.a)).json();
  expect(second.entries).toHaveLength(4); expect(second.next).toBeNull(); expect(second.summary).toEqual(first.summary);
  expect(new Set([...first.entries, ...second.entries].map((entry: { id: string }) => entry.id)).size).toBe(24);
  expect((await (await clientHistory("month=2020-02&clientId=planning-it-a")).json()).summary).toEqual(first.summary);
});
it("reflects corrected attendance without stored or stale monthly totals", async () => {
  const response = await attendance({ id: "history-00", clientId: "planning-it-a", status: "absent", version: 1, requestId: randomUUID(), reason: "Correction de test pour le bilan mensuel" });
  expect(response.status).toBe(200);
  const history = await (await clientHistory("month=2020-02", cookies.a)).json();
  expect(history.summary).toMatchObject({ present: 0, absent: 2, attendanceRate: 0 });
  const empty = await (await clientHistory("month=2019-01", cookies.a)).json();
  expect(empty.entries).toEqual([]); expect(empty.summary.attendanceRate).toBeNull();
});
it("fails explicitly on an oversized month instead of returning misleading totals", async () => {
  const batch = getFirestore(app).batch();
  for (let index = 0; index < 500; index++) batch.create(getFirestore(app).doc(`centers/alger/sessions/history-limit-${index}`), { ...data, id: `history-limit-${index}`, centerId: "alger", startsAt: parseStudioDateTime("2018-01-15T10:00"), status: "scheduled" });
  await batch.commit();
  await getFirestore(app).doc("centers/alger/sessions/history-limit-extra").set({ ...data, id: "history-limit-extra", centerId: "alger", startsAt: parseStudioDateTime("2018-01-15T10:00"), status: "scheduled" });
  expect((await clientHistory("month=2018-01", cookies.a)).status).toBe(409);
});

function attendance(body: object, cookie = cookies.admin, requestOrigin = origin) {
  return fetch(origin + "/api/presences", { method: "POST", headers: { "Content-Type": "application/json", Origin: requestOrigin, Cookie: cookie }, body: JSON.stringify(body) });
}
function attendanceHistory(id: string, cookie = cookies.admin, before?: number) {
  return fetch(origin + `/api/presences?id=${id}&clientId=planning-it-a${before ? `&before=${before}` : ""}`, { headers: { Cookie: cookie } });
}
async function endedSession() {
  const session = await create();
  expect((await post({ action: "book", id: session.id }, cookies.a)).status).toBe(200);
  await getFirestore(app).doc(`centers/alger/sessions/${session.id}`).update({ startsAt: Date.now() - 2 * 3600000 });
  return session;
}
it("restricts attendance and its history to active administrators of the center", async () => {
  const session = await endedSession();
  const input = { id: session.id, clientId: "planning-it-a", status: "present", version: 0, requestId: randomUUID() };
  expect((await attendance(input, "")).status).toBe(401);
  expect((await attendance(input, cookies.a)).status).toBe(403);
  expect((await attendanceHistory(session.id, cookies.a)).status).toBe(403);
  expect((await attendance(input, cookies.admin, "https://evil.test")).status).toBe(403);
  expect((await attendance({ ...input, centerId: "oran" })).status).toBe(400);
  expect((await attendance({ ...input, id: "../other" })).status).toBe(400);
  await getFirestore(app).doc("centers/oran/sessions/attendance-foreign").set({ ...data, id: "attendance-foreign", centerId: "oran", status: "scheduled" });
  expect((await attendance({ ...input, id: "attendance-foreign" })).status).toBe(404);
  const member = getFirestore(app).doc("centers/alger/members/planning-it-admin");
  await member.update({ active: false });
  expect((await attendance(input)).status).toBe(403);
  await member.update({ active: true });
});
it("refuses pointage before the end or for cancelled and missing reservations", async () => {
  const session = await create();
  await post({ action: "book", id: session.id }, cookies.a);
  const input = { id: session.id, clientId: "planning-it-a", status: "absent", version: 0, requestId: randomUUID() };
  expect((await attendance(input)).status).toBe(409);
  expect((await post({ action: "cancel-session", id: session.id }, cookies.admin)).status).toBe(200);
  expect((await attendance(input)).status).toBe(409);
  const other = await endedSession();
  expect((await attendance({ ...input, id: other.id, clientId: "planning-it-b" })).status).toBe(404);
  await getFirestore(app).doc(`centers/alger/sessions/${other.id}/bookings/planning-it-a`).update({ status: "cancelled" });
  expect((await attendance({ ...input, id: other.id })).status).toBe(409);
});
it("records attendance once, permits justified correction, and never changes credits", async () => {
  const session = await endedSession();
  const before = await balance("a");
  const input = { id: session.id, clientId: "planning-it-a", status: "present", version: 0, requestId: randomUUID() };
  const repeats = await Promise.all([attendance(input), attendance(input)]);
  expect(repeats.map((response) => response.status)).toEqual([200, 200]);
  expect((await (await attendanceHistory(session.id)).json()).events).toHaveLength(1);
  const corrected = { ...input, status: "absent", version: 1, requestId: randomUUID(), reason: "Erreur de feuille vérifiée par la coach" };
  expect((await attendance({ ...corrected, reason: "" })).status).toBe(400);
  expect((await attendance(corrected)).status).toBe(200);
  expect((await attendance(input)).status).toBe(200);
  const detail = await (await get(`?id=${session.id}`)).json();
  expect(detail.attendees[0].attendance).toEqual({ status: "absent", version: 2 });
  expect(detail.session.bookedCount).toBe(1);
  expect(await balance("a")).toBe(before);
  const response = await attendanceHistory(session.id);
  expect(response.headers.get("cache-control")).toBe("no-store");
  const history = await response.json();
  expect(history.events).toHaveLength(2);
  expect(history.events[0]).toMatchObject({ from: "present", to: "absent", version: 2, reason: corrected.reason, actorUid: "planning-it-admin" });
  const client = await (await get(`?id=${session.id}`, cookies.a)).json();
  expect(client.attendees).toEqual([]); expect(JSON.stringify(client)).not.toContain(corrected.reason);
});
it("rejects a stale concurrent correction instead of overwriting another administrator", async () => {
  const session = await endedSession();
  const input = { id: session.id, clientId: "planning-it-a", version: 0, requestId: randomUUID(), status: "present" };
  const results = await Promise.all([attendance(input), attendance({ ...input, requestId: randomUUID(), status: "absent" })]);
  expect(results.map((response) => response.status).sort()).toEqual([200, 409]);
  expect((await (await attendanceHistory(session.id)).json()).events).toHaveLength(1);
});
it("paginates the complete correction history by revision", async () => {
  const session = await endedSession();
  for (let version = 0; version < 22; version++) {
    expect((await attendance({ id: session.id, clientId: "planning-it-a", version, requestId: randomUUID(), status: version % 2 ? "absent" : "present", reason: version ? "Correction de démonstration" : "" })).status).toBe(200);
  }
  const first = await (await attendanceHistory(session.id)).json();
  expect(first.events).toHaveLength(20); expect(first.next).toBe(3);
  const second = await (await attendanceHistory(session.id, cookies.admin, first.next)).json();
  expect(second.events.map((event: { version: number }) => event.version)).toEqual([2, 1]); expect(second.next).toBeNull();
});

it("protects package attribution and isolates each customer balance", async () => {
  expect((await assign("d", packageInput, randomUUID(), "")).status).toBe(401);
  expect((await assign("d", packageInput, randomUUID(), cookies.a)).status).toBe(403);
  expect((await assign("d", packageInput, randomUUID(), cookies.admin, "https://evil.test")).status).toBe(403);
  expect((await packages("b", cookies.a)).status).toBe(403);
  const own = await fetch(origin + "/api/forfaits", { headers: { Cookie: cookies.a } });
  expect(own.status).toBe(200); expect(own.headers.get("cache-control")).toBe("no-store");
  expect((await own.json()).packages.every((pack: { clientId: string }) => pack.clientId === "planning-it-a")).toBe(true);
  expect((await assign("missing")).status).toBe(404);
  await getFirestore(app).doc("centers/oran/clients/planning-it-foreign").set({ id: "planning-it-foreign", centerId: "oran", status: "active" });
  expect((await assign("foreign")).status).toBe(404);
  const member = getFirestore(app).doc("centers/alger/members/planning-it-e");
  await member.update({ active: false });
  expect((await fetch(origin + "/api/forfaits", { headers: { Cookie: cookies.e } })).status).toBe(403);
  await member.update({ active: true, clientId: "planning-it-a" });
  expect((await fetch(origin + "/api/forfaits", { headers: { Cookie: cookies.e } })).status).toBe(403);
  await member.update({ clientId: "planning-it-e" });
});
it("attributes a package exactly once under concurrent retries and validates its terms", async () => {
  const requestId = randomUUID();
  const input = { ...packageInput, credits: 1 };
  const results = await Promise.all([assign("d", input, requestId), assign("d", input, requestId)]);
  expect(results.map((response) => response.status)).toEqual([201, 201]);
  expect(await balance("d")).toBe(1);
  expect((await assign("d", { ...input, credits: 2 }, requestId)).status).toBe(409);
  for (const value of [{ ...input, credits: 0 }, { ...input, expiresAt: input.validFrom }, { ...input, expiresAt: Date.now() - 60000 }]) expect((await assign("d", value)).status).toBe(400);
  const profile = getFirestore(app).doc("centers/alger/clients/planning-it-e");
  await profile.update({ status: "inactive" });
  expect((await assign("e")).status).toBe(409);
  await profile.update({ status: "active" });
  expect((await getFirestore(app).collection(`centers/alger/clients/planning-it-d/packages/${requestId}/movements`).get()).size).toBe(1);
});
it("uses the final credit only once across concurrent reservations in different sessions", async () => {
  const sessions = await Promise.all([create(), create()]);
  const results = await Promise.all(sessions.map((session) => post({ action: "book", id: session.id }, cookies.d)));
  expect(results.map((response) => response.status).sort()).toEqual([200, 409]);
  expect(await balance("d")).toBe(0);
  const winner = sessions[results[0].status === 200 ? 0 : 1];
  const outcomes = await Promise.all([post({ action: "cancel-booking", id: winner.id }, cookies.d), post({ action: "cancel-session", id: winner.id }, cookies.admin)]);
  expect(outcomes.map((response) => response.status)).toEqual([200, 200]);
  expect(await balance("d")).toBe(1);
  const packs = (await (await packages("d")).json()).packages;
  const events = await getFirestore(app).collection(`centers/alger/clients/planning-it-d/packages/${packs[0].id}/movements`).get();
  expect(events.size).toBe(3);
  expect(events.docs.reduce((sum, doc) => sum + doc.data().delta, 0)).toBe(1);
});
it("requires a credit valid at the session date and consumes the earliest expiry first", async () => {
  const session = await create();
  expect((await post({ action: "book", id: session.id }, cookies.e)).status).toBe(409);
  const short = { ...packageInput, ...packageDates(studioDay(), studioDay(Date.now() + 86400000)) };
  const future = { ...packageInput, ...packageDates(studioDay(Date.now() + 3 * 86400000), studioDay(Date.now() + 30 * 86400000)) };
  expect((await assign("e", short)).status).toBe(201);
  expect((await assign("e", future)).status).toBe(201);
  expect((await post({ action: "book", id: session.id }, cookies.e)).status).toBe(409);
  const earlyId = randomUUID(), lateId = randomUUID();
  expect((await assign("e", { ...packageInput, expiresAt: data.startsAt + 86400000 }, earlyId)).status).toBe(201);
  expect((await assign("e", packageInput, lateId)).status).toBe(201);
  expect((await post({ action: "book", id: session.id }, cookies.e)).status).toBe(200);
  const booking = getFirestore(app).doc(`centers/alger/sessions/${session.id}/bookings/planning-it-e`);
  expect((await booking.get()).data()?.creditPackageId).toBe(earlyId);
  expect((await post({ action: "cancel-booking", id: session.id }, cookies.e)).status).toBe(200);
  expect((await post({ action: "book", id: session.id }, cookies.e)).status).toBe(200);
  expect((await booking.get()).data()?.creditRevision).toBe(2);
  expect((await post({ action: "cancel-session", id: session.id }, cookies.admin)).status).toBe(200);
  const pack = (await getFirestore(app).doc(`centers/alger/clients/planning-it-e/packages/${earlyId}`).get()).data();
  expect(pack?.remaining).toBe(50);
  expect(pack?.expiresAt).toBe(data.startsAt + 86400000);
});
it("does not invent credits when cancelling a legacy reservation", async () => {
  const session = await create();
  const before = await balance("a");
  const ref = getFirestore(app).doc(`centers/alger/sessions/${session.id}`);
  await ref.update({ bookedCount: 1 });
  await ref.collection("bookings").doc("planning-it-a").set({ sessionId: session.id, centerId: "alger", clientId: "planning-it-a", status: "confirmed" });
  expect((await post({ action: "cancel-session", id: session.id }, cookies.admin)).status).toBe(200);
  expect(await balance("a")).toBe(before);
});
it("paginates package history without losing packages assigned at the same time", async () => {
  const batch = getFirestore(app).batch();
  const assignedAt = Date.now();
  for (let index = 0; index < 21; index++) {
    const id = `pack-page-${index}`;
    batch.create(getFirestore(app).doc(`centers/alger/clients/planning-it-c/packages/${id}`), { ...packageInput, remaining: 0, id, centerId: "alger", clientId: "planning-it-c", assignedAt });
  }
  await batch.commit();
  const first = await (await packages("c")).json();
  expect(first.packages).toHaveLength(20); expect(first.next).toBeTruthy();
  const second = await (await fetch(origin + `/api/forfaits?clientId=planning-it-c&after=${first.next}`, { headers: { Cookie: cookies.admin } })).json();
  expect(second.packages).toHaveLength(2); expect(second.next).toBeNull();
  expect(new Set([...first.packages, ...second.packages].map((pack: { id: string }) => pack.id)).size).toBe(22);
});

it("rejects anonymous access, CSRF, client administration and identity injection", async () => {
  expect((await get("", "")).status).toBe(401);
  expect((await post({ action: "book", id: "x" })).status).toBe(401);
  expect((await post({ action: "create", requestId: randomUUID(), session: data }, cookies.a)).status).toBe(403);
  expect((await post({ action: "cancel-session", id: "x" }, cookies.a)).status).toBe(403);
  expect((await post({ action: "book", id: "x" }, cookies.admin)).status).toBe(403);
  expect((await post({ action: "book", id: "x" }, cookies.a, "https://evil.test")).status).toBe(403);
  expect((await post({ action: "book", id: "x", clientId: "planning-it-b" }, cookies.a)).status).toBe(400);
  expect((await post({ action: "cancel-booking", id: "x", clientId: "planning-it-b" }, cookies.a)).status).toBe(403);
  expect((await post({ action: "create", requestId: randomUUID(), session: { ...data, centerId: "oran" } }, cookies.admin)).status).toBe(400);
  const page = await (await fetch(origin + "/crm/planning", { headers: { Cookie: cookies.a } })).text();
  expect(page).toContain("Accès non autorisé");
});
it("creates future sessions and safely retries an identical creation request", async () => {
  const requestId = randomUUID();
  for (let attempt = 0; attempt < 2; attempt++) expect((await post({ action: "create", requestId, session: data }, cookies.admin)).status).toBe(201);
  expect((await post({ action: "create", requestId, session: { ...data, capacity: 2 } }, cookies.admin)).status).toBe(409);
  for (const session of [{ ...data, startsAt: Date.now() - 60000 }, { ...data, capacity: 0 }, { ...data, capacity: 5 }, { ...data, durationMinutes: 59 }, { ...data, durationMinutes: 61 }]) expect((await post({ action: "create", requestId: randomUUID(), session }, cookies.admin)).status).toBe(400);
  expect((await (await get(`?id=${requestId}`)).json()).session.bookedCount).toBe(0);
  expect((await get("?day=2030-02-30")).status).toBe(400);
});
it("assigns the last place to only one simultaneous customer", async () => {
  const session = await create();
  const responses = await Promise.all([post({ action: "book", id: session.id }, cookies.a), post({ action: "book", id: session.id }, cookies.b)]);
  expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
  const detail = await (await get(`?id=${session.id}`)).json();
  expect(detail.session.bookedCount).toBe(1); expect(detail.attendees).toHaveLength(1);
  const winner = responses[0].status === 200 ? "a" : "b";
  const customer = await get(`?id=${session.id}`, cookies[winner]);
  expect(customer.headers.get("cache-control")).toBe("no-store");
  const visible = await customer.json(); expect(visible.myBooking).toBe("confirmed"); expect(visible.attendees).toEqual([]);
  expect(JSON.stringify(visible)).not.toContain("Private client"); expect(JSON.stringify(visible)).not.toContain("@pilates.test");
});
it("does not double-book a repeated request and releases a place exactly once", async () => {
  const session = await create();
  const before = await balance("a");
  const repeats = await Promise.all([post({ action: "book", id: session.id }, cookies.a), post({ action: "book", id: session.id }, cookies.a)]);
  expect(repeats.map((response) => response.status)).toEqual([200, 200]);
  expect(await balance("a")).toBe(before - 1);
  expect((await (await get(`?id=${session.id}`)).json()).session.bookedCount).toBe(1);
  const cancellations = await Promise.all([post({ action: "cancel-booking", id: session.id }, cookies.a), post({ action: "cancel-booking", id: session.id }, cookies.a)]);
  expect(cancellations.map((response) => response.status)).toEqual([200, 200]);
  expect(await balance("a")).toBe(before);
  expect((await (await get(`?id=${session.id}`, cookies.a)).json()).myBooking).toBe("cancelled");
  expect((await (await get(`?id=${session.id}`)).json()).session.bookedCount).toBe(0);
  expect((await post({ action: "book", id: session.id }, cookies.b)).status).toBe(200);
  expect((await post({ action: "book", id: session.id }, cookies.a)).status).toBe(409);
});
it("lets administration cancel a booking without affecting the other participant", async () => {
  const session = await create(2);
  expect((await post({ action: "book", id: session.id }, cookies.a)).status).toBe(200);
  expect((await post({ action: "book", id: session.id }, cookies.b)).status).toBe(200);
  expect((await post({ action: "cancel-booking", id: session.id, clientId: "planning-it-a" }, cookies.admin)).status).toBe(200);
  const detail = await (await get(`?id=${session.id}`)).json();
  expect(detail.session.bookedCount).toBe(1); expect(detail.attendees.map((item: { clientId: string }) => item.clientId)).toEqual(["planning-it-b"]);
});
it("cancels a session atomically for all participants and rejects new bookings", async () => {
  const session = await create(2);
  const before = await Promise.all([balance("a"), balance("b")]);
  for (const key of ["a", "b"]) expect((await post({ action: "book", id: session.id }, cookies[key])).status).toBe(200);
  expect((await post({ action: "cancel-session", id: session.id }, cookies.admin)).status).toBe(200);
  expect((await post({ action: "cancel-session", id: session.id }, cookies.admin)).status).toBe(200);
  expect(await Promise.all([balance("a"), balance("b")])).toEqual(before);
  for (const key of ["a", "b"]) {
    const detail = await (await get(`?id=${session.id}`, cookies[key])).json();
    expect(detail.myBooking).toBe("session-cancelled"); expect(detail.session.bookedCount).toBe(0);
  }
  expect((await post({ action: "book", id: session.id }, cookies.c)).status).toBe(409);
});
it("keeps cancellation authoritative when racing a reservation", async () => {
  const session = await create();
  const before = await balance("a");
  const [booking, cancellation] = await Promise.all([post({ action: "book", id: session.id }, cookies.a), post({ action: "cancel-session", id: session.id }, cookies.admin)]);
  expect([200, 409]).toContain(booking.status); expect(cancellation.status).toBe(200);
  const detail = await (await get(`?id=${session.id}`, cookies.a)).json();
  expect(detail.session.status).toBe("cancelled"); expect(detail.session.bookedCount).toBe(0);
  expect(["none", "session-cancelled"]).toContain(detail.myBooking);
  expect(await balance("a")).toBe(before);
});
it("refuses another center and rechecks membership and profile linkage", async () => {
  const session = await create();
  await getFirestore(app).doc("centers/oran/sessions/foreign").set({ ...data, id: "foreign", centerId: "oran", status: "scheduled", bookedCount: 0 });
  expect((await get("?id=foreign", cookies.a)).status).toBe(404);
  expect((await post({ action: "book", id: "foreign" }, cookies.a)).status).toBe(404);
  expect((await post({ action: "cancel-session", id: "foreign" }, cookies.admin)).status).toBe(404);
  const member = getFirestore(app).doc("centers/alger/members/planning-it-c");
  await member.update({ active: false });
  expect((await post({ action: "book", id: session.id }, cookies.c)).status).toBe(403);
  await member.update({ active: true, clientId: "planning-it-b" });
  expect((await post({ action: "book", id: session.id }, cookies.c)).status).toBe(403);
  await member.update({ clientId: "planning-it-c" });
});
it("blocks inactive profiles from booking but permits cancelling an existing booking", async () => {
  const session = await create();
  expect((await post({ action: "book", id: session.id }, cookies.c)).status).toBe(200);
  const profile = getFirestore(app).doc("centers/alger/clients/planning-it-c");
  await profile.update({ status: "inactive" });
  expect((await post({ action: "book", id: session.id }, cookies.c)).status).toBe(403);
  expect((await post({ action: "cancel-booking", id: session.id }, cookies.c)).status).toBe(200);
  await profile.update({ status: "active" });
});
it("refuses reservations and cancellations once a session has started", async () => {
  const session = await create(2);
  expect((await post({ action: "book", id: session.id }, cookies.a)).status).toBe(200);
  await getFirestore(app).doc(`centers/alger/sessions/${session.id}`).update({ startsAt: Date.now() - 60000 });
  expect((await post({ action: "book", id: session.id }, cookies.b)).status).toBe(409);
  expect((await post({ action: "cancel-booking", id: session.id }, cookies.a)).status).toBe(409);
  expect((await post({ action: "cancel-session", id: session.id }, cookies.admin)).status).toBe(409);
});
it("paginates a day with identical start times using a stable second key", async () => {
  const paginationDay = studioDay(Date.now() + 4 * 86400000);
  const batch = getFirestore(app).batch();
  for (let index = 0; index < 51; index++) {
    const id = `pagination-${String(index).padStart(2, "0")}`;
    batch.create(getFirestore(app).doc(`centers/alger/sessions/${id}`), { ...data, startsAt: parseStudioDateTime(`${paginationDay}T10:00`), id, centerId: "alger", bookedCount: 0, status: "scheduled" });
  }
  await batch.commit();
  const first = await (await get(`?day=${paginationDay}`)).json();
  expect(first.sessions).toHaveLength(50); expect(first.next).toBeTruthy();
  const second = await (await get(`?day=${paginationDay}&after=${first.next}`)).json();
  expect(second.sessions).toHaveLength(1); expect(second.next).toBeNull();
  expect(new Set([...first.sessions, ...second.sessions].map((item: { session: { id: string } }) => item.session.id)).size).toBe(51);
});

function subscribe(key: string, subscription: object, requestId = randomUUID(), cookie = cookies.admin, requestOrigin = origin) {
  return fetch(origin + "/api/abonnements", { method: "POST", headers: { "Content-Type": "application/json", Origin: requestOrigin, Cookie: cookie }, body: JSON.stringify({ clientId: "planning-it-" + key, requestId, subscription }) });
}
it("validates subscription authorization, terms, prices and profile status", async () => {
  const input = { offerId: "monthly-4", term: "quarterly", purchaseDate: studioDay() };
  expect((await subscribe("sub", input, randomUUID(), "")).status).toBe(401);
  expect((await subscribe("sub", input, randomUUID(), cookies.sub)).status).toBe(403);
  expect((await subscribe("sub", input, randomUUID(), cookies.admin, "http://evil.invalid")).status).toBe(403);
  for (const change of [{ amountDzd: 1 }, { credits: 100 }, { purchaseDate: "2026-02-30" }, { purchaseDate: studioDay(Date.now() + 86400000) }, { purchaseDate: "2020-01-01" }]) {
    expect((await subscribe("sub", { ...input, ...change })).status).toBe(400);
  }
  expect((await subscribe("missing", input)).status).toBe(404);
  const profile = getFirestore(app).doc("centers/alger/clients/planning-it-sub");
  await profile.update({ status: "inactive" });
  expect((await subscribe("sub", input)).status).toBe(409);
  expect((await profile.collection("packages").get()).size).toBe(0);
  await profile.update({ status: "active" });
});
it("creates a quarterly subscription atomically and replays without duplicate credits", async () => {
  const input = { offerId: "monthly-4", term: "quarterly", purchaseDate: studioDay() };
  const requestId = randomUUID();
  const response = await subscribe("sub", input, requestId);
  expect(response.status).toBe(201);
  const record = (await response.json()).subscription;
  expect(record.amountDzd).toBe(28800); expect(record.periods).toHaveLength(3);
  expect(await (await subscribe("sub", input, requestId)).json()).toEqual({ subscription: record });
  expect((await subscribe("sub", { ...input, offerId: "monthly-8" }, requestId)).status).toBe(409);
  expect((await subscribe("sub", input)).status).toBe(409);
  const all = (await (await packages("sub")).json()).packages;
  expect(all).toHaveLength(3); expect(all.map((p: { remaining: number }) => p.remaining)).toEqual([4, 4, 4]);
  const stored = await getFirestore(app).doc("centers/alger/clients/planning-it-sub/subscriptions/" + requestId).get();
  expect(stored.data()?.paymentRecorded).toBe(false);
});
it("serializes competing subscriptions for the same customer", async () => {
  const input = { offerId: "monthly-8", term: "quarterly", purchaseDate: studioDay() };
  const responses = await Promise.all([subscribe("subrace", input), subscribe("subrace", input)]);
  expect(responses.map(r => r.status).sort()).toEqual([201, 409]);
  expect((await (await packages("subrace")).json()).packages).toHaveLength(3);
});
it("consumes only the monthly period covering the session and refunds the same period", async () => {
  const packs = (await (await packages("sub")).json()).packages.sort((a: { validFrom: number }, b: { validFrom: number }) => a.validFrom - b.validFrom);
  const sessions = [];
  for (let i = 0; i < 5; i++) {
    const response = await post({ action: "create", requestId: randomUUID(), session: { ...data, startsAt: packs[0].validFrom + 86400000 + i * 3600000 } }, cookies.admin);
    expect(response.status).toBe(201); sessions.push((await response.json()).session);
  }
  for (let i = 0; i < 4; i++) expect((await post({ action: "book", id: sessions[i].id }, cookies.sub)).status).toBe(200);
  expect((await post({ action: "book", id: sessions[4].id }, cookies.sub)).status).toBe(409);
  const remaining = async () => (await (await packages("sub")).json()).packages.sort((a: { validFrom: number }, b: { validFrom: number }) => a.validFrom - b.validFrom).map((p: { remaining: number }) => p.remaining);
  expect(await remaining()).toEqual([0, 4, 4]);
  const future = await post({ action: "create", requestId: randomUUID(), session: { ...data, startsAt: packs[1].validFrom + 3600000 } }, cookies.admin);
  expect(future.status).toBe(201); const next = (await future.json()).session;
  expect((await post({ action: "book", id: next.id }, cookies.sub)).status).toBe(200);
  expect(await remaining()).toEqual([0, 3, 4]);
  expect((await post({ action: "cancel-booking", id: sessions[0].id }, cookies.sub)).status).toBe(200);
  expect(await remaining()).toEqual([1, 3, 4]);
});

const subscriptions = (query: string, cookie = cookies.admin) => fetch(origin + "/api/abonnements" + query, { headers: { Cookie: cookie } });
it("protects subscription history and returns only public stored conditions", async () => {
  expect((await subscriptions("", "")).status).toBe(401);
  expect((await subscriptions("?clientId=planning-it-subrace", cookies.sub)).status).toBe(403);
  expect((await subscriptions("?after=bad", cookies.sub)).status).toBe(400);
  expect((await subscriptions("?clientId=missing")).status).toBe(404);
  const response = await subscriptions("", cookies.sub);
  expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
  const page = await response.json();
  expect(page.subscriptions).toHaveLength(1);
  expect(page.subscriptions[0]).toMatchObject({ clientId: "planning-it-sub", amountDzd: 28800 });
  expect(page.subscriptions[0]).not.toHaveProperty("assignedBy");
  expect(page.subscriptions[0]).not.toHaveProperty("paymentRecorded");
  const member = getFirestore(app).doc("centers/alger/members/planning-it-sub");
  try {
    await member.update({ clientId: "planning-it-subrace" });
    expect((await subscriptions("", cookies.sub)).status).toBe(403);
    await member.update({ clientId: "planning-it-sub", active: false });
    expect((await subscriptions("", cookies.sub)).status).toBe(403);
  } finally { await member.update({ clientId: "planning-it-sub", active: true }); }
});
it("paginates equal-timestamp subscriptions without duplicates and preserves recorded prices", async () => {
  const collection = getFirestore(app).collection("centers/alger/clients/planning-it-subrace/subscriptions");
  const stored = (await collection.get()).docs[0].data();
  const batch = getFirestore(app).batch();
  for (let i = 0; i < 22; i++) {
    const id = `history-${String(i).padStart(2, "0")}`;
    batch.set(collection.doc(id), { ...stored, id, assignedAt: stored.assignedAt + 1, amountDzd: 12345 });
  }
  await batch.commit();
  const first = await (await subscriptions("?clientId=planning-it-subrace")).json();
  expect(first.subscriptions).toHaveLength(20); expect(first.next).toBeTruthy();
  expect(first.subscriptions[0].amountDzd).toBe(12345);
  const second = await (await subscriptions("?" + new URLSearchParams({ clientId: "planning-it-subrace", after: first.next }))).json();
  expect(second.subscriptions).toHaveLength(3); expect(second.next).toBeNull();
  const ids = [...first.subscriptions, ...second.subscriptions].map((s: { id: string }) => s.id);
  expect(new Set(ids).size).toBe(23);
  const html = await (await fetch(origin + "/espace-cliente/forfaits", { headers: { Cookie: cookies.subrace } })).text();
  expect(html).toContain("Abonnements attribués");
  expect(html).toContain("Abonnements plus anciens");
});

async function paymentSubscriptionId() {
  return (await (await subscriptions("?clientId=planning-it-sub")).json()).subscriptions[0].id as string;
}
function cash(subscriptionId: string, payment: object, requestId: string = randomUUID(), cookie = cookies.admin, requestOrigin = origin) {
  return fetch(origin + "/api/encaissements", { method: "POST", headers: { Cookie: cookie, Origin: requestOrigin, "Content-Type": "application/json" }, body: JSON.stringify({ clientId: "planning-it-sub", subscriptionId, requestId, payment }) });
}
function cashJournal(subscriptionId: string, after?: string, cookie = cookies.admin) {
  return fetch(origin + "/api/encaissements?" + new URLSearchParams({ clientId: "planning-it-sub", subscriptionId, ...(after ? { after } : {}) }), { headers: { Cookie: cookie } });
}
it("restricts cash journals and rejects forged amounts, methods and dates", async () => {
  const id = await paymentSubscriptionId();
  const payment = { amountMinor: 500000, receivedDate: studioDay(), method: "cash" };
  expect((await cashJournal(id, undefined, "")).status).toBe(401);
  expect((await cashJournal(id, undefined, cookies.sub)).status).toBe(403);
  expect((await cash(id, payment, randomUUID(), cookies.sub)).status).toBe(403);
  expect((await cash(id, payment, randomUUID(), cookies.admin, "http://evil.invalid")).status).toBe(403);
  for (const change of [{ amountMinor: 0 }, { amountMinor: -1 }, { amountMinor: 1.5 }, { method: "transfer" }, { receivedDate: "2026-02-30" }, { receivedDate: "2020-01-01" }, { receivedDate: studioDay(Date.now() + 86400000) }, { paidMinor: 0 }]) {
    expect((await cash(id, { ...payment, ...change })).status).toBe(400);
  }
  expect((await cashJournal(randomUUID())).status).toBe(404);
  expect((await cashJournal(id, "bad")).status).toBe(400);
  const journal = await (await cashJournal(id)).json();
  expect(journal).toMatchObject({ paidMinor: 0, totalMinor: 2880000, payments: [] });
});
it("records a cash deposit once and preserves credits and the private audit author", async () => {
  const id = await paymentSubscriptionId();
  const credits = await balance("sub");
  const payment = { amountMinor: 500000, receivedDate: studioDay(), method: "cash" };
  const requestId = randomUUID();
  const responses = await Promise.all([cash(id, payment, requestId), cash(id, payment, requestId)]);
  expect(responses.map(r => r.status)).toEqual([201, 201]);
  const first = await responses[0].json(); expect(await responses[1].json()).toEqual(first);
  expect((await cash(id, { ...payment, amountMinor: 1 }, requestId)).status).toBe(409);
  const response = await cashJournal(id); expect(response.headers.get("cache-control")).toBe("no-store");
  const journal = await response.json();
  expect(journal.paidMinor).toBe(500000); expect(journal.payments).toHaveLength(1);
  expect(journal.payments[0]).not.toHaveProperty("recordedBy");
  const stored = await getFirestore(app).doc(`centers/alger/clients/planning-it-sub/subscriptions/${id}/payments/${requestId}`).get();
  expect(stored.data()?.recordedBy).toBe("planning-it-admin");
  expect(await balance("sub")).toBe(credits);
  const html = await (await fetch(origin + `/crm/clientes/planning-it-sub/abonnements/${id}/paiements`, { headers: { Cookie: cookies.admin } })).text();
  expect(html).toContain("Journal des encaissements"); expect(html).toContain("Montant reçu en DA");
});
it("paginates cash history and serializes competing final payments without overpayment", async () => {
  const id = await paymentSubscriptionId();
  const payment = { amountMinor: 1, receivedDate: studioDay(), method: "cash" };
  for (let i = 0; i < 21; i++) expect((await cash(id, payment)).status).toBe(201);
  const first = await (await cashJournal(id)).json();
  expect(first.payments).toHaveLength(20); expect(first.paidMinor).toBe(500021);
  const second = await (await cashJournal(id, first.next)).json();
  expect(second.payments).toHaveLength(2); expect(second.next).toBeNull();
  expect(new Set([...first.payments, ...second.payments].map((p: { id: string }) => p.id)).size).toBe(22);
  const finalPayment = { ...payment, amountMinor: first.totalMinor - first.paidMinor };
  const responses = await Promise.all([cash(id, finalPayment), cash(id, finalPayment)]);
  expect(responses.map(r => r.status).sort()).toEqual([201, 409]);
  const journal = await (await cashJournal(id)).json(); expect(journal.paidMinor).toBe(journal.totalMinor);
  expect((await cash(id, payment)).status).toBe(409);
});

function correctCash(subscriptionId: string, correction: object, requestId = randomUUID(), cookie = cookies.admin, requestOrigin = origin) {
  return fetch(origin + "/api/encaissements/corrections", { method: "POST", headers: { Cookie: cookie, Origin: requestOrigin, "Content-Type": "application/json" }, body: JSON.stringify({ clientId: "planning-it-sub", subscriptionId, requestId, correction }) });
}
it("validates correction authorization and the mandatory reason", async () => {
  const id = await paymentSubscriptionId();
  const correction = { paymentId: randomUUID(), reason: "Erreur de saisie" };
  expect((await correctCash(id, correction, randomUUID(), "")).status).toBe(401);
  expect((await correctCash(id, correction, randomUUID(), cookies.sub)).status).toBe(403);
  expect((await correctCash(id, correction, randomUUID(), cookies.admin, "http://evil.invalid")).status).toBe(403);
  expect((await correctCash(id, correction)).status).toBe(404);
  for (const change of [{ reason: " " }, { reason: "x".repeat(301) }, { paymentId: "../other" }, { amountMinor: -1 }]) {
    expect((await correctCash(id, { ...correction, ...change })).status).toBe(400);
  }
});
it("corrects a cash entry once, retains the audit and never revives it on replay", async () => {
  const id = await paymentSubscriptionId();
  const collection = getFirestore(app).collection(`centers/alger/clients/planning-it-sub/subscriptions/${id}/payments`);
  const originalDoc = (await collection.get()).docs.find(doc => doc.data().amountMinor === 500000)!;
  const original = originalDoc.data();
  const credits = await balance("sub");
  const correction = { paymentId: originalDoc.id, reason: "Montant saisi deux fois par erreur" };
  const requestId = randomUUID();
  const responses = await Promise.all([correctCash(id, correction, requestId), correctCash(id, correction, requestId)]);
  expect(responses.map(r => r.status)).toEqual([201, 201]);
  const result = await responses[0].json(); expect(await responses[1].json()).toEqual(result);
  expect(result.correction.amountMinor).toBe(-500000); expect(result.correction).not.toHaveProperty("recordedBy");
  expect((await correctCash(id, { ...correction, reason: "Un autre motif" }, requestId)).status).toBe(409);
  expect((await correctCash(id, correction)).status).toBe(409);
  const corrected = (await originalDoc.ref.get()).data()!;
  for (const key of ["amountMinor", "receivedDate", "recordedAt", "recordedBy"]) expect(corrected[key]).toEqual(original[key]);
  const audit = (await getFirestore(app).doc(`centers/alger/clients/planning-it-sub/subscriptions/${id}/paymentCorrections/${requestId}`).get()).data();
  expect(audit).toMatchObject({ recordedBy: "planning-it-admin", amountMinor: -500000, paymentId: originalDoc.id });
  expect((await (await cashJournal(id)).json()).paidMinor).toBe(2380000);
  const replay = await cash(id, { amountMinor: original.amountMinor, receivedDate: original.receivedDate, method: "cash" }, originalDoc.id);
  expect(replay.status).toBe(201); expect((await replay.json()).payment.correction.id).toBe(requestId);
  expect((await (await cashJournal(id)).json()).paidMinor).toBe(2380000);
  expect(await balance("sub")).toBe(credits);
  const page = await (await fetch(origin + `/crm/clientes/planning-it-sub/abonnements/${id}/paiements`, { headers: { Cookie: cookies.admin } })).text();
  expect(page).toContain("Corriger une erreur de saisie");
  const journal = await (await cashJournal(id)).json();
  const older = await (await fetch(origin + `/crm/clientes/planning-it-sub/abonnements/${id}/paiements?` + new URLSearchParams({ after: journal.next }), { headers: { Cookie: cookies.admin } })).text();
  expect(older).toContain("Saisie annulée"); expect(older).toContain(correction.reason);
  expect(corrected.correction).toMatchObject({ id: requestId, reason: correction.reason });
  expect((await cash(id, { amountMinor: 500000, receivedDate: studioDay(), method: "cash" })).status).toBe(201);
});
it("allows only one of two distinct concurrent corrections for the same entry", async () => {
  const id = await paymentSubscriptionId();
  const docs = await getFirestore(app).collection(`centers/alger/clients/planning-it-sub/subscriptions/${id}/payments`).get();
  const target = docs.docs.find(doc => doc.data().amountMinor === 1)!;
  const correction = { paymentId: target.id, reason: "Encaissement de test saisi par erreur" };
  const responses = await Promise.all([correctCash(id, correction), correctCash(id, correction)]);
  expect(responses.map(r => r.status).sort()).toEqual([201, 409]);
  expect((await (await cashJournal(id)).json()).paidMinor).toBe(2879999);
});
