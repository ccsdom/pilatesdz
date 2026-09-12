import { describe, expect, it, vi } from "vitest";
import { createAccessManagement } from "../../src/services/access-management";
import type { Access } from "../../src/domain/models/access";

const admin: Access = { uid: "admin", centerId: "alger", role: "admin" };
function setup() {
  const accounts = { create: vi.fn().mockResolvedValue("new-client"), invitation: vi.fn().mockResolvedValue("local-link") };
  const members = { add: vi.fn(), find: vi.fn().mockResolvedValue({ uid: "client", email: "client@pilates.test", active: true }), deactivate: vi.fn() };
  return { accounts, members, service: createAccessManagement(accounts, members) };
}
describe("access management", () => {
  it("refuses all client administration before any data operation", async () => {
    const { service, accounts, members } = setup();
    const client: Access = { ...admin, role: "client" };
    await expect(service.invite(client, "x@pilates.test", "X")).rejects.toMatchObject({ status: 403 });
    await expect(service.invitation(client, "x")).rejects.toMatchObject({ status: 403 });
    await expect(service.deactivate(client, "x")).rejects.toMatchObject({ status: 403 });
    expect(accounts.create).not.toHaveBeenCalled(); expect(members.find).not.toHaveBeenCalled(); expect(members.deactivate).not.toHaveBeenCalled();
  });
  it("attaches a new client to the authenticated administrator's center", async () => {
    const { service, members } = setup();
    await expect(service.invite(admin, "x@pilates.test", "X")).resolves.toEqual({ uid: "new-client", invitationUrl: "local-link" });
    expect(members.add).toHaveBeenCalledWith(admin, { uid: "new-client", email: "x@pilates.test", name: "X", active: true });
  });
  it("does not issue a link when membership creation fails", async () => {
    const { service, members, accounts } = setup();
    members.add.mockRejectedValue(new Error("Unavailable"));
    await expect(service.invite(admin, "x@pilates.test", "X")).rejects.toThrow();
    expect(accounts.invitation).not.toHaveBeenCalled();
  });
  it("does not disable the administrator's own access", async () => {
    const { service, members } = setup();
    await expect(service.deactivate(admin, admin.uid)).rejects.toMatchObject({ status: 403 });
    expect(members.deactivate).not.toHaveBeenCalled();
  });
  it("reports a recoverable invitation failure after account creation", async () => {
    const { service, members, accounts } = setup();
    accounts.invitation.mockRejectedValue(new Error("Unavailable"));
    await expect(service.invite(admin, "x@pilates.test", "X")).rejects.toMatchObject({ status: 409 });
    expect(members.add).toHaveBeenCalledOnce();
    expect(accounts.create).toHaveBeenCalledOnce();
  });
  it("does not generate a link for an inactive membership", async () => {
    const { service, members, accounts } = setup();
    members.find.mockResolvedValue({ uid: "client", email: "client@pilates.test", active: false });
    await expect(service.invitation(admin, "client")).rejects.toMatchObject({ status: 403 });
    expect(accounts.invitation).not.toHaveBeenCalled();
  });
});
