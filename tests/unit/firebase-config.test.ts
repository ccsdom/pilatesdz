import { describe, expect, it } from "vitest";
import { DEMO_PROJECT_ID, validateLocalFirebase } from "@/config/firebase-local";

const valid = {
  enabled: "true", projectId: DEMO_PROJECT_ID, nodeEnv: "test",
  authHost: "127.0.0.1:9099", firestoreHost: "127.0.0.1:8080", storageHost: "127.0.0.1:9199",
};

describe("Firebase local isolation", () => {
  it("accepts only the explicitly configured demo environment", () => {
    expect(validateLocalFirebase(valid).firestore).toEqual({ host: "127.0.0.1", port: 8080 });
  });
  it.each([
    { enabled: undefined }, { enabled: "false" }, { projectId: "real-project" },
    { nodeEnv: "production" }, { authHost: undefined }, { firestoreHost: undefined },
    { storageHost: undefined }, { authHost: "remote.example:9099" },
    { firestoreHost: "http://127.0.0.1:8080" }, { storageHost: "127.0.0.1:65536" },
    { authHost: "127.0.0.1:0" },
  ])("rejects unsafe or partial configuration: %j", (override) => {
    expect(() => validateLocalFirebase({ ...valid, ...override })).toThrow();
  });
});
