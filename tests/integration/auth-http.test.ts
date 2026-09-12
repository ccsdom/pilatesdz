import { createHash, randomBytes } from "node:crypto";
import { afterAll, beforeAll, expect, it } from "vitest";
import { initializeApp, deleteApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app: App;
const origin = process.env.AUTH_TEST_ORIGIN;
const password = randomBytes(20).toString("base64url");
const ids = ["it-client", "it-admin", "it-other", "it-disabled"];
beforeAll(async () => {
  if (origin !== "http://127.0.0.1:3102" || process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9098" ||
      process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8082") throw new Error("Use pnpm test:auth.");
  app = initializeApp({ projectId: "demo-pilates-center-alger" }, "auth-http-tests");
  for (const uid of ids) {
    await getAuth(app).createUser({ uid, email: `${uid}@pilates.test`, password, disabled: uid === "it-disabled" });
    const centerId = uid === "it-other" ? "oran" : "alger";
    await getFirestore(app).doc(`centers/${centerId}/members/${uid}`).set({ uid, centerId, active: true, role: uid === "it-admin" ? "admin" : "client" });
  }
  // An admin claim in Auth is deliberately not the membership role.
  await getAuth(app).setCustomUserClaims("it-client", { role: "admin", centerId: "oran" });
});
afterAll(async () => { if (app) await deleteApp(app); });

async function idToken(uid: string) {
  const response = await fetch("http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `${uid}@pilates.test`, password, returnSecureToken: true }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error("Test sign-in failed");
  return body.idToken as string;
}
function post(path: string, body: object, cookie?: string, requestOrigin: string | null = origin!) {
  return fetch(origin + path, { method: "POST", headers: {
    "Content-Type": "application/json", ...(requestOrigin ? { Origin: requestOrigin } : {}), ...(cookie ? { Cookie: cookie } : {}),
  }, body: JSON.stringify(body), redirect: "manual" });
}
async function login(uid: string) {
  const response = await post("/api/auth/session", { idToken: await idToken(uid) });
  expect(response.status).toBe(200);
  const header = response.headers.get("set-cookie")!;
  expect(header).toContain("HttpOnly"); expect(header).toContain("SameSite=strict"); expect(header).toContain("Max-Age=28800");
  return { cookie: header.split(";")[0], destination: (await response.json()).destination };
}
const me = (cookie?: string) => fetch(origin + "/api/auth/me", { headers: cookie ? { Cookie: cookie } : {} });

it("redirects anonymous private pages and returns 401 from the API", async () => {
  for (const path of ["/crm", "/espace-cliente"]) {
    const response = await fetch(origin + path, { redirect: "manual" });
    expect(response.status).toBe(307); expect(response.headers.get("location")).toBe("/connexion");
    expect(await response.text()).not.toContain("286 500 DA");
  }
  expect((await me()).status).toBe(401);
  expect((await me("pilates_session=forged")).status).toBe(401);
});
it("rejects cross-origin, missing-origin and role-injection requests", async () => {
  expect((await post("/api/auth/session", {}, undefined, "https://evil.test")).status).toBe(403);
  expect((await post("/api/auth/session", {}, undefined, null)).status).toBe(403);
  expect((await post("/api/auth/session", { idToken: "x", role: "admin" })).status).toBe(400);
  expect((await post("/api/auth/session", { idToken: "forged" })).status).toBe(401);
});
it("routes clients correctly and never leaks CRM data to them", async () => {
  const { cookie, destination } = await login("it-client");
  expect(destination).toBe("/espace-cliente");
  const response = await me(cookie); expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ uid: "it-client", centerId: "alger", role: "client" });
  const html = await (await fetch(origin + "/crm", { headers: { Cookie: cookie } })).text();
  expect(html).toContain("Accès non autorisé"); expect(html).not.toContain("286 500 DA");
});
it("allows the center administrator into the demonstration CRM", async () => {
  const { cookie, destination } = await login("it-admin"); expect(destination).toBe("/crm");
  expect(await (await fetch(origin + "/crm", { headers: { Cookie: cookie } })).text()).toContain("286 500 DA");
});
it("rejects a user belonging only to another center", async () => {
  expect((await post("/api/auth/session", { idToken: await idToken("it-other") })).status).toBe(403);
});
it("rejects a disabled account at Firebase sign-in", async () => {
  await expect(idToken("it-disabled")).rejects.toThrow();
});
it("applies membership deactivation on the next request", async () => {
  const { cookie } = await login("it-client");
  const member = getFirestore(app).doc("centers/alger/members/it-client");
  await member.update({ active: false });
  expect((await me(cookie)).status).toBe(403);
  await member.update({ active: true });
});
it("rejects an expired server session", async () => {
  const { cookie } = await login("it-client");
  const token = cookie.split("=")[1];
  await getFirestore(app).doc(`authSessions/${createHash("sha256").update(token).digest("hex")}`).update({ expiresAt: 0 });
  expect((await me(cookie)).status).toBe(401);
});
it("rechecks a changed role before rendering CRM data", async () => {
  const { cookie } = await login("it-admin");
  const member = getFirestore(app).doc("centers/alger/members/it-admin");
  await member.update({ role: "client" });
  const html = await (await fetch(origin + "/crm", { headers: { Cookie: cookie } })).text();
  expect(html).toContain("Accès non autorisé"); expect(html).not.toContain("286 500 DA");
  await member.update({ role: "admin" });
});
it("rejects an existing session when the Firebase account is disabled", async () => {
  const { cookie } = await login("it-client");
  await getAuth(app).updateUser("it-client", { disabled: true });
  expect((await me(cookie)).status).toBe(401);
  await getAuth(app).updateUser("it-client", { disabled: false });
});
it("invalidates the current cookie immediately on logout", async () => {
  const { cookie } = await login("it-admin");
  expect((await post("/api/auth/logout", {}, cookie, "https://evil.test")).status).toBe(403);
  expect((await me(cookie)).status).toBe(200);
  const response = await post("/api/auth/logout", {}, cookie);
  expect(response.status).toBe(200); expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  expect((await me(cookie)).status).toBe(401);
});

it("protects access management from visitors, clients, CSRF and privilege injection", async () => {
  const path = "/api/crm/acces";
  const invitation = { action: "invite", email: "forbidden@pilates.test", name: "Forbidden" };
  expect((await post(path, invitation)).status).toBe(401);
  const client = await login("it-client");
  expect((await post(path, invitation, client.cookie)).status).toBe(403);
  const html = await (await fetch(origin + "/crm/acces", { headers: { Cookie: client.cookie } })).text();
  expect(html).toContain("Accès non autorisé"); expect(html).not.toContain("Inviter une cliente");
  const admin = await login("it-admin");
  expect((await post(path, invitation, admin.cookie, "https://evil.test")).status).toBe(403);
  expect((await post(path, { ...invitation, role: "admin" }, admin.cookie)).status).toBe(400);
  expect((await post(path, { ...invitation, centerId: "oran" }, admin.cookie)).status).toBe(400);
  expect((await post(path, { action: "deactivate", uid: "it-admin" }, admin.cookie)).status).toBe(403);
  expect((await post(path, { action: "deactivate", uid: "it-other" }, admin.cookie)).status).toBe(404);
  expect((await post(path, { action: "invitation", uid: "it-other" }, admin.cookie)).status).toBe(404);
  expect((await post(path, { action: "invitation", uid: "it-admin" }, admin.cookie)).status).toBe(403);
});

it("invites a client, consumes the link once, then disables only this center", async () => {
  const admin = await login("it-admin");
  const path = "/api/crm/acces";
  const payload = { action: "invite", email: "invited@pilates.test", name: "Cliente invitée" };
  const created = await post(path, payload, admin.cookie);
  expect(created.status).toBe(201); expect(created.headers.get("cache-control")).toBe("no-store");
  const { uid, invitationUrl } = await created.json();
  const member = getFirestore(app).doc(`centers/alger/members/${uid}`);
  expect((await member.get()).data()).toMatchObject({ uid, centerId: "alger", role: "client", active: true });
  const link = new URL(invitationUrl);
  expect(link.origin).toBe(origin); expect(link.pathname).toBe("/connexion/mot-de-passe"); expect(link.search).toBe("");
  const resetBody = { oobCode: new URLSearchParams(link.hash.slice(1)).get("oobCode"), newPassword: password };
  const reset = () => fetch("http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=demo-api-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(resetBody) });
  expect((await reset()).status).toBe(200); expect((await reset()).status).toBe(400);
  const signIn = await fetch("http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: payload.email, password, returnSecureToken: true }) });
  expect(signIn.status).toBe(200);
  const token = (await signIn.json()).idToken;
  const session = await post("/api/auth/session", { idToken: token });
  expect(session.status).toBe(200);
  const cookie = session.headers.get("set-cookie")!.split(";")[0];
  expect((await me(cookie)).status).toBe(200);
  expect((await post(path, payload, admin.cookie)).status).toBe(409);
  expect((await post(path, { action: "invitation", uid }, admin.cookie)).status).toBe(200);
  const other = getFirestore(app).doc(`centers/oran/members/${uid}`);
  await other.set({ uid, centerId: "oran", role: "client", active: true });
  expect((await post(path, { action: "deactivate", uid }, admin.cookie)).status).toBe(200);
  expect((await me(cookie)).status).toBe(403);
  expect((await post("/api/auth/session", { idToken: token })).status).toBe(403);
  expect((await other.get()).data()?.active).toBe(true);
  expect((await getAuth(app).getUser(uid)).disabled).toBe(false);
  expect((await post(path, { action: "invitation", uid }, admin.cookie)).status).toBe(403);
  expect((await post(path, { action: "deactivate", uid }, admin.cookie)).status).toBe(200);
});

it("recovers a password through the local out-of-band mailbox", async () => {
  const email = "recovery@pilates.test";
  await getAuth(app).createUser({ email, password });
  const result = await fetch("http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=demo-api-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestType: "PASSWORD_RESET", email }) });
  expect(result.status).toBe(200);
  const inbox = await (await fetch("http://127.0.0.1:9098/emulator/v1/projects/demo-pilates-center-alger/oobCodes")).json();
  const message = inbox.oobCodes.find((item: { email: string }) => item.email === email);
  expect(message.requestType).toBe("PASSWORD_RESET");
  const newPassword = randomBytes(20).toString("base64url");
  const reset = await fetch("http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=demo-api-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oobCode: message.oobCode, newPassword }) });
  expect(reset.status).toBe(200);
  for (const [value, status] of [[password, 400], [newPassword, 200]] as const) {
    const signIn = await fetch("http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: value, returnSecureToken: true }) });
    expect(signIn.status).toBe(status);
  }
});
