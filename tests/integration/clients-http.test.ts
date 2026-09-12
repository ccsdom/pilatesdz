import { randomBytes, createHash } from "node:crypto";
import { afterAll, beforeAll, expect, it } from "vitest";
import { initializeApp, deleteApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { clientSearchPrefixes } from "../../src/domain/models/client";

const origin = "http://127.0.0.1:3102";
const authOrigin = "http://127.0.0.1:9098";
let app: App;
let adminCookie: string;
let clientCookie: string;
const password = randomBytes(20).toString("base64url");
const contact = { name: "Émilie Ben-Ali", email: "crm-emilie@pilates.test", phone: "+213 550 12 34 56", status: "active" };
const path = "/api/crm/clientes";

async function authPost(action: string, body: object) {
  return fetch(`${authOrigin}/identitytoolkit.googleapis.com/v1/accounts:${action}?key=demo-api-key`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
function post(body: object, cookie?: string, requestOrigin = origin, route = path) {
  return fetch(origin + route, { method: "POST", headers: { "Content-Type": "application/json", Origin: requestOrigin, ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
}
function get(query = "", cookie = adminCookie) { return fetch(origin + path + query, { headers: { Cookie: cookie } }); }
async function create(input = contact) {
  const response = await post({ action: "create", profile: input }, adminCookie);
  expect(response.status).toBe(201); return (await response.json()).profile;
}
beforeAll(async () => {
  if (process.env.AUTH_TEST_ORIGIN !== origin || process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9098" || process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8082") throw new Error("Use pnpm test:auth");
  app = initializeApp({ projectId: "demo-pilates-center-alger" }, "client-http-tests");
  for (const role of ["admin", "client"]) {
    const uid = `crm-it-${role}`;
    const email = `${uid}@pilates.test`;
    await getAuth(app).createUser({ uid, email, password });
    await getFirestore(app).doc(`centers/alger/members/${uid}`).set({ uid, centerId: "alger", role, active: true });
    const token = await (await authPost("signInWithPassword", { email, password, returnSecureToken: true })).json();
    const session = await post({ idToken: token.idToken }, undefined, origin, "/api/auth/session");
    expect(session.status).toBe(200);
    const cookie = session.headers.get("set-cookie")!.split(";")[0];
    if (role === "admin") adminCookie = cookie; else clientCookie = cookie;
  }
});
afterAll(async () => { if (app) await deleteApp(app); });

it("protects profile pages and endpoints from anonymous users and clients", async () => {
  expect((await get("", "")).status).toBe(401);
  expect((await get("", clientCookie)).status).toBe(403);
  for (const body of [{ action: "create", profile: contact }, { action: "update", id: "any", version: 1, profile: contact }, { action: "invite", id: "any" }]) {
    expect((await post(body)).status).toBe(401);
    expect((await post(body, clientCookie)).status).toBe(403);
  }
  for (const route of ["/crm/clientes", "/crm/clientes/nouvelle", "/crm/clientes/any"]) {
    expect((await fetch(origin + route, { redirect: "manual" })).status).toBe(307);
    const html = await (await fetch(origin + route, { headers: { Cookie: clientCookie } })).text();
    expect(html).toContain("Accès non autorisé"); expect(html).not.toContain(contact.email);
  }
});
it("rejects CSRF, injected authority, invalid phone and traversal", async () => {
  expect((await post({ action: "create", profile: contact }, adminCookie, "https://evil.test")).status).toBe(403);
  for (const profile of [{ ...contact, centerId: "oran" }, { ...contact, authUid: "someone" }, { ...contact, role: "admin" }, { ...contact, phone: "abc" }]) expect((await post({ action: "create", profile }, adminCookie)).status).toBe(400);
  expect((await get("?id=..%2Fmembers")).status).toBe(400);
});
it("creates, searches and updates a profile while preventing stale writes", async () => {
  const profile = await create();
  expect(profile).toMatchObject({ ...contact, centerId: "alger", authUid: null, version: 1 });
  const detail = await get(`?id=${profile.id}`);
  expect(detail.headers.get("cache-control")).toBe("no-store");
  expect((await detail.json()).access).toBe("none");
  for (const q of ["EMI", "ben", "+213 (550)", "CRM-EMILIE@", "ali"]) {
    const result = await (await get(`?q=${encodeURIComponent(q)}`)).json();
    expect(result.clients.map((item: { id: string }) => item.id)).toContain(profile.id);
  }
  const updatedContact = { ...contact, name: "Nadia Ben-Ali", email: "crm-nadia@pilates.test", phone: "0550 98 76 54", status: "inactive" };
  const updated = await post({ action: "update", id: profile.id, version: 1, profile: updatedContact }, adminCookie);
  expect(updated.status).toBe(200); expect((await updated.json()).profile.version).toBe(2);
  expect((await post({ action: "update", id: profile.id, version: 1, profile: contact }, adminCookie)).status).toBe(409);
  expect((await (await get("?q=crm-emilie@")).json()).clients).toHaveLength(0);
  expect((await (await get("?q=nadia")).json()).clients.map((item: { id: string }) => item.id)).toContain(profile.id);
  expect((await post({ action: "invite", id: profile.id }, adminCookie)).status).toBe(409);
});
it("enforces email uniqueness under concurrent creation and update", async () => {
  const input = { ...contact, email: "unique-crm@pilates.test" };
  const responses = await Promise.all([post({ action: "create", profile: input }, adminCookie), post({ action: "create", profile: { ...input, email: " UNIQUE-CRM@PILATES.TEST " } }, adminCookie)]);
  expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
  const other = await create({ ...contact, email: "unique-other@pilates.test" });
  expect((await post({ action: "update", id: other.id, version: 1, profile: input }, adminCookie)).status).toBe(409);
  expect((await (await get(`?id=${other.id}`)).json()).profile.email).toBe("unique-other@pilates.test");
});
it("isolates another center's profile and ignores a forged query center", async () => {
  const id = "oran-only-profile";
  await getFirestore(app).doc(`centers/oran/clients/${id}`).set({ ...contact, id, centerId: "oran", authUid: null, invitationUid: null, version: 1, createdAt: 1, updatedAt: 1, searchPrefixes: clientSearchPrefixes({ ...contact, status: "active" }) });
  expect((await get(`?id=${id}`)).status).toBe(404);
  expect((await post({ action: "update", id, version: 1, profile: contact }, adminCookie)).status).toBe(404);
  expect((await post({ action: "invite", id }, adminCookie)).status).toBe(404);
  const list = await (await get("?centerId=oran")).json();
  expect(list.clients.every((item: { centerId: string }) => item.centerId === "alger")).toBe(true);
  expect((await getFirestore(app).doc(`centers/oran/clients/${id}`).get()).data()?.version).toBe(1);
});
it("paginates filtered results without duplicates or omissions", async () => {
  for (let index = 0; index < 28; index++) await create({ ...contact, name: `Pagination ${index}`, email: `page-client-${index}@pilates.test` });
  const first = await (await get("?q=pagination")).json();
  expect(first.clients).toHaveLength(25); expect(first.next).toBeTruthy();
  const second = await (await get(`?q=pagination&after=${first.next}`)).json();
  expect(second.clients).toHaveLength(3); expect(second.next).toBeNull();
  expect(new Set([...first.clients, ...second.clients].map((item: { id: string }) => item.id)).size).toBe(28);
});
it("links an invited profile to exactly one identity and enforces deactivation", async () => {
  const profile = await create({ ...contact, email: "profile-invite@pilates.test" });
  const response = await post({ action: "invite", id: profile.id }, adminCookie);
  expect(response.status).toBe(200);
  const invitation = await response.json();
  expect(invitation.clientId).toBe(profile.id);
  const code = new URLSearchParams(new URL(invitation.invitationUrl).hash.slice(1)).get("oobCode");
  expect((await authPost("resetPassword", { oobCode: code, newPassword: password })).status).toBe(200);
  const token = await (await authPost("signInWithPassword", { email: profile.email, password, returnSecureToken: true })).json();
  const session = await post({ idToken: token.idToken }, undefined, origin, "/api/auth/session");
  expect(session.status).toBe(200);
  const linked = await (await get(`?id=${profile.id}`)).json();
  expect(linked.profile.authUid).toBe(invitation.uid); expect(linked.access).toBe("active");
  expect((await getFirestore(app).doc(`centers/alger/members/${invitation.uid}`).get()).data()?.clientId).toBe(profile.id);
  const again = await post({ action: "invite", id: profile.id }, adminCookie);
  expect(again.status).toBe(200); expect((await again.json()).uid).toBe(invitation.uid);
  expect((await post({ action: "update", id: profile.id, version: linked.profile.version, profile: { ...contact, email: "changed-identity@pilates.test" } }, adminCookie)).status).toBe(409);
  const rename = await post({ action: "update", id: profile.id, version: linked.profile.version, profile: { ...contact, email: profile.email, name: "Nouveau nom" } }, adminCookie);
  expect(rename.status).toBe(200);
  expect((await getFirestore(app).doc(`centers/alger/members/${invitation.uid}`).get()).data()?.name).toBe("Nouveau nom");
  expect((await post({ action: "deactivate", uid: invitation.uid }, adminCookie, origin, "/api/crm/acces")).status).toBe(200);
  expect((await (await get(`?id=${profile.id}`)).json()).access).toBe("disabled");
  expect((await post({ action: "invite", id: profile.id }, adminCookie)).status).toBe(403);
  const cookie = session.headers.get("set-cookie")!.split(";")[0];
  expect((await fetch(origin + "/api/auth/me", { headers: { Cookie: cookie } })).status).toBe(403);
});
it("resumes provisioning with a reserved UID after an interrupted Auth creation", async () => {
  const profile = await create({ ...contact, email: "resume-profile@pilates.test" });
  const uid = `pc_${createHash("sha256").update(`alger/${profile.id}`).digest("hex")}`;
  await getFirestore(app).doc(`centers/alger/clients/${profile.id}`).update({ invitationUid: uid });
  await getAuth(app).createUser({ uid, email: profile.email, password });
  const response = await post({ action: "invite", id: profile.id }, adminCookie);
  expect(response.status).toBe(200); expect((await response.json()).uid).toBe(uid);
  expect((await (await get(`?id=${profile.id}`)).json()).access).toBe("active");
});
it("never takes over an existing unrelated account and allows correcting its email", async () => {
  const profile = await create({ ...contact, email: "existing-external@pilates.test" });
  await getAuth(app).createUser({ uid: "external-account", email: profile.email, password });
  expect((await post({ action: "invite", id: profile.id }, adminCookie)).status).toBe(409);
  expect((await getFirestore(app).doc("centers/alger/members/external-account").get()).exists).toBe(false);
  const details = await (await get(`?id=${profile.id}`)).json(); expect(details.access).toBe("none");
  expect((await post({ action: "update", id: profile.id, version: details.profile.version, profile: { ...contact, email: "corrected-external@pilates.test" } }, adminCookie)).status).toBe(200);
  expect((await post({ action: "invite", id: profile.id }, adminCookie)).status).toBe(200);
});
