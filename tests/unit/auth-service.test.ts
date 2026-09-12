import { describe, expect, it, vi } from "vitest";
import { createAuthService } from "@/services/auth-service";
import { AccessError } from "@/domain/models/access";
import type { Membership } from "@/domain/models/access";

function setup(membership: Membership | null = { uid: "alice", centerId: "alger", active: true, role: "client" }) {
  const auth = {
    verifyIdToken: vi.fn().mockResolvedValue({ uid: "alice", authTime: 1000 }),
    verifySession: vi.fn().mockResolvedValue({ uid: "alice", authTime: 1000 }),
    createSession: vi.fn().mockResolvedValue("opaque-cookie"), revokeSessions: vi.fn(),
  };
  const memberships = { find: vi.fn().mockResolvedValue(membership) };
  return { auth, memberships, service: createAuthService(auth, memberships, "alger", () => 1000_000) };
}

describe("Server access policies", () => {
  it("issues a session only after the membership check", async () => {
    const { service, auth } = setup();
    expect((await service.login("token")).access.role).toBe("client");
    expect(auth.createSession).toHaveBeenCalledOnce();
  });
  it.each([null, { uid: "bob", centerId: "alger", active: true, role: "admin" },
    { uid: "alice", centerId: "oran", active: true, role: "admin" },
    { uid: "alice", centerId: "alger", active: false, role: "admin" }] as (Membership | null)[])("does not create a session for invalid membership %j", async (membership) => {
    const { service, auth } = setup(membership);
    await expect(service.login("token")).rejects.toMatchObject({ status: 403 });
    expect(auth.createSession).not.toHaveBeenCalled();
  });
  it("rejects a client from the CRM even with a valid session", async () => {
    await expect(setup().service.authorize("cookie", ["admin"])).rejects.toMatchObject({ status: 403 });
  });
  it("rejects anonymous access before touching the repository", async () => {
    const { service, memberships } = setup();
    await expect(service.authorize(undefined, ["client"])).rejects.toMatchObject({ status: 401 });
    expect(memberships.find).not.toHaveBeenCalled();
  });
  it("rechecks membership on subsequent requests", async () => {
    const { service, memberships } = setup();
    await service.authorize("cookie", ["client"]);
    memberships.find.mockResolvedValue(null);
    await expect(service.authorize("cookie", ["client"])).rejects.toMatchObject({ status: 403 });
  });
  it.each([699, 1031, NaN])("rejects stale or invalid authentication time %s", async (authTime) => {
    const { service, auth } = setup(); auth.verifyIdToken.mockResolvedValue({ uid: "alice", authTime });
    await expect(service.login("token")).rejects.toMatchObject({ status: 401 });
    expect(auth.createSession).not.toHaveBeenCalled();
  });
  it("revokes a valid session and accepts an already-invalid session on logout", async () => {
    const { service, auth } = setup();
    await service.logout("cookie");
    expect(auth.revokeSessions).toHaveBeenCalledWith("alice", "cookie");
    auth.verifySession.mockRejectedValue(new AccessError(401));
    await expect(service.logout("cookie")).resolves.toBeUndefined();
  });
});
