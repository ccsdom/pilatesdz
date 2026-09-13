import { describe, expect, it } from "vitest";
import { CLOUD_PROJECT_ID, validateCloudFirebase, validateCloudWeb } from "../../src/config/firebase-cloud";

describe("cloud Firebase isolation", () => {
  const input = { enabled: "false", projectId: CLOUD_PROJECT_ID };
  it("requires an explicit cloud selection and the approved project", () => {
    expect(validateCloudFirebase(input).mode).toBe("cloud");
    for (const enabled of [undefined, "true", "", "FALSE"]) expect(() => validateCloudFirebase({ ...input, enabled })).toThrow();
    expect(() => validateCloudFirebase({ ...input, projectId: "demo-pilates-center-alger" })).toThrow();
    expect(() => validateCloudFirebase({ ...input, projectId: "other-project" })).toThrow();
  });
  it.each(["authHost", "firestoreHost", "storageHost"])("rejects mixed configuration: %s", (key) => {
    expect(() => validateCloudFirebase({ ...input, [key]: "127.0.0.1:9099" })).toThrow();
  });
  it("requires the correct web application, domain and bucket", () => {
    const web = { apiKey: "public-test-value", appId: "1:736869698241:web:71bb6d30d3610cfb642240", authDomain: `${CLOUD_PROJECT_ID}.firebaseapp.com`, storageBucket: `${CLOUD_PROJECT_ID}.firebasestorage.app` };
    expect(validateCloudWeb(web)).toEqual(web);
    for (const key of Object.keys(web)) expect(() => validateCloudWeb({ ...web, [key]: "" })).toThrow();
    expect(() => validateCloudWeb({ ...web, authDomain: "other.firebaseapp.com" })).toThrow();
  });
});
