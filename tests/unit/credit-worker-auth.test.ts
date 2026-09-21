import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ verify: vi.fn(), run: vi.fn() }));
vi.mock("google-auth-library", () => ({ OAuth2Client: class { verifyIdToken = mocks.verify; } }));
vi.mock("@/lib/firebase/admin", () => ({ getFirebaseAdmin: () => ({ firestore: {} }) }));
vi.mock("@/repositories/firestore/credit-settlement", () => ({ settlementRepository: () => ({ runAutomatic: mocks.run }) }));
import { POST } from "../../app/api/internal/credits/route";
const audience = "https://pilates.test/api/internal/credits";
const request = (token?: string) => new NextRequest(audience, { method: "POST", headers: token ? { authorization: `Bearer ${token}` } : {} });
beforeEach(() => {
  vi.stubEnv("CREDIT_WORKER_AUDIENCE", audience);
  vi.stubEnv("CREDIT_WORKER_SERVICE_ACCOUNT", "worker@pilates.test");
  vi.stubEnv("CENTER_ID", "alger");
  mocks.verify.mockReset(); mocks.run.mockReset();
});
afterEach(() => vi.unstubAllEnvs());
it("refuses unconfigured or unauthenticated calls before accessing data", async () => {
  expect((await POST(request())).status).toBe(401);
  vi.stubEnv("CREDIT_WORKER_AUDIENCE", "");
  expect((await POST(request("token"))).status).toBe(503);
  expect(mocks.run).not.toHaveBeenCalled();
});
it("refuses invalid signatures or claims and a different service account", async () => {
  mocks.verify.mockRejectedValueOnce(new Error("Invalid signature or expired token"));
  expect((await POST(request("invalid"))).status).toBe(401);
  for (const payload of [{ email: "other@pilates.test", email_verified: true }, { email: "worker@pilates.test", email_verified: false }]) {
    mocks.verify.mockResolvedValueOnce({ getPayload: () => payload });
    expect((await POST(request("token"))).status).toBe(403);
  }
  expect(mocks.run).not.toHaveBeenCalled();
});
it("checks the exact audience and runs only for the verified worker identity", async () => {
  mocks.verify.mockResolvedValue({ getPayload: () => ({ email: "worker@pilates.test", email_verified: true }) });
  mocks.run.mockResolvedValue({ processed: 2, failed: 0 });
  const result = await POST(request("valid"));
  expect(mocks.verify).toHaveBeenCalledWith({ idToken: "valid", audience });
  expect(mocks.run).toHaveBeenCalledWith("alger");
  expect(await result.json()).toEqual({ processed: 2, failed: 0 });
});
