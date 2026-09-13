import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, it } from "vitest";
import { assertFails, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getMetadata, deleteObject, listAll } from "firebase/storage";

let env: RulesTestEnvironment;
beforeAll(async () => {
  if (process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8082" ||
      process.env.FIREBASE_STORAGE_EMULATOR_HOST !== "127.0.0.1:9198") {
    throw new Error("Run pnpm test:security with the local emulator launcher.");
  }
  env = await initializeTestEnvironment({
    projectId: "demo-pilates-center-alger",
    firestore: { host: "127.0.0.1", port: 8082, rules: readFileSync("firestore.rules", "utf8") },
    storage: { host: "127.0.0.1", port: 9198, rules: readFileSync("storage.rules", "utf8") },
  });
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "centers/alger/clients/example"), { centerId: "alger" });
    await uploadBytes(ref(context.storage(), "centers/alger/example.txt"), new Uint8Array([1]));
  });
});
afterAll(async () => { await env?.cleanup(); });

describe.each(["anonymous", "client", "admin", "other-center"])("Default deny: %s", (identity) => {
  it("denies document read, list, write and delete, even with claimed roles", async () => {
    const context = identity === "anonymous" ? env.unauthenticatedContext() :
      env.authenticatedContext(identity, { role: identity, centerId: identity === "other-center" ? "oran" : "alger" });
    const db = context.firestore();
    const target = doc(db, "centers/alger/clients/example");
    await assertFails(getDoc(target));
    await assertFails(getDocs(collection(db, "centers/alger/clients")));
    await assertFails(setDoc(target, { centerId: "oran", role: "admin" }));
    await assertFails(deleteDoc(target));
    await assertFails(getDoc(doc(db, "authSessions/example")));
    await assertFails(setDoc(doc(db, "centers/alger/members/self"), { role: "admin", active: true }));
    await assertFails(getDoc(doc(db, "centers/alger/clientEmails/example")));
    await assertFails(setDoc(doc(db, "centers/alger/clientEmails/example"), { clientId: "self" }));
    await assertFails(setDoc(target, { centerId: "alger", authUid: identity, status: "active" }));
    await assertFails(getDoc(doc(db, "centers/alger/sessions/example")));
    await assertFails(setDoc(doc(db, "centers/alger/sessions/example"), { capacity: 99, bookedCount: 0 }));
    await assertFails(getDocs(collection(db, "centers/alger/sessions/example/bookings")));
    await assertFails(setDoc(doc(db, "centers/alger/sessions/example/bookings/self"), { status: "confirmed" }));
    await assertFails(setDoc(doc(db, "centers/alger/sessions/example/bookings/self"), { attendance: { status: "present", version: 1 } }));
    await assertFails(getDocs(collection(db, "centers/alger/sessions/example/bookings/self/attendanceEvents")));
    await assertFails(setDoc(doc(db, "centers/alger/sessions/example/bookings/self/attendanceEvents/fake"), { to: "present" }));
    await assertFails(getDoc(doc(db, "centers/alger/clients/example/packages/test")));
    await assertFails(setDoc(doc(db, "centers/alger/clients/example/packages/test"), { remaining: 100 }));
    await assertFails(getDocs(collection(db, "centers/alger/clients/example/packages/test/movements")));
    await assertFails(setDoc(doc(db, "centers/alger/clients/example/packages/test/movements/fake"), { delta: 100 }));
  });
  it("denies file read, list, upload and delete", async () => {
    const context = identity === "anonymous" ? env.unauthenticatedContext() : env.authenticatedContext(identity);
    const storage = context.storage();
    const target = ref(storage, "centers/alger/example.txt");
    await assertFails(getMetadata(target));
    await assertFails(listAll(ref(storage, "centers/alger")));
    await assertFails(uploadBytes(target, new Uint8Array([2])));
    await assertFails(deleteObject(target));
  });
});
