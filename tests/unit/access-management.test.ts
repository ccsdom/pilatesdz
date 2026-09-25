import { describe, expect, it, vi } from "vitest";
import { createAccessManagement } from "../../src/services/access-management";
import type { Access } from "../../src/domain/models/access";

const admin: Access = { uid: "admin", centerId: "alger", role: "admin" };
function setup() {
  const accounts = { create: vi.fn().mockResolvedValue("new-client"), invitation: vi.fn().mockResolvedValue("local-link") };
  const members = { add: vi.fn(), find: vi.fn().mockResolvedValue({ uid: "client", email: "client@pilates.test", active: true }), deactivate: vi.fn(), reactivate: vi.fn(), reserveManager: vi.fn(), addManager: vi.fn() };
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
    await expect(service.invite(admin, "x@pilates.test", "X")).resolves.toEqual({ uid: "new-client", invitationUrl: "local-link", emailAccepted: false });
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

it("returns an email acknowledgement without an action link for cloud invitations", async () => {
  const { accounts, service } = setup();
  accounts.invitation.mockResolvedValue(null);
  await expect(service.invite(admin, "recipient@example.invalid", "Cliente")).resolves.toEqual({ uid: "new-client", invitationUrl: null, emailAccepted: true });
  await expect(service.invitation(admin, "client")).resolves.toEqual({ invitationUrl: null, emailAccepted: true });
});

it("denies client role all access operations before touching accounts", async () => {
  const { service, accounts, members } = setup();
  const actor: Access = { ...admin, role: "client" };
  await expect(service.invite(actor, "c@example.test", "C")).rejects.toMatchObject({ status: 403 });
  await expect(service.inviteManager(actor, "team@example.test", "Team")).rejects.toMatchObject({ status: 403 });
  await expect(service.reactivate(actor, "someone")).rejects.toMatchObject({ status: 403 });
  await expect(service.deactivate(actor, "someone")).rejects.toMatchObject({ status: 403 });
  await expect(service.invitation(actor, "someone")).rejects.toMatchObject({ status: 403 });
  expect(accounts.create).not.toHaveBeenCalled();
  expect(members.reserveManager).not.toHaveBeenCalled();
  expect(members.reactivate).not.toHaveBeenCalled();
});

it("allows manager role to manage client access while denying manager invitations", async () => {
  const { service, accounts, members } = setup();
  const manager: Access = { ...admin, role: "manager" };
  await expect(service.invite(manager, "x@pilates.test", "X")).resolves.toEqual({ uid: "new-client", invitationUrl: "local-link", emailAccepted: false });
  await expect(service.inviteManager(manager, "team@example.test", "Team")).rejects.toMatchObject({ status: 403 });
});

it("reserves manager identity before provisioning and sends an invitation after attaching membership", async () => {
  const { service, accounts, members } = setup();
  members.reserveManager.mockResolvedValue("manager-reserved");
  await expect(service.inviteManager(admin, "team@example.test", "Team")).resolves.toMatchObject({ uid: "manager-reserved" });
  expect(accounts.create).toHaveBeenCalledWith("team@example.test", "Team", "manager-reserved");
  expect(members.addManager).toHaveBeenCalledWith(admin, "manager-reserved");
  expect(members.addManager.mock.invocationCallOrder[0]).toBeLessThan(accounts.invitation.mock.invocationCallOrder[0]);
});

it("never attaches manager membership when account provisioning conflicts", async () => {
  const { service, accounts, members } = setup();
  accounts.create.mockRejectedValue(new Error("Account conflict"));
  await expect(service.inviteManager(admin, "team@example.test", "Team")).rejects.toThrow("Account conflict");
  expect(members.addManager).not.toHaveBeenCalled();
  expect(accounts.invitation).not.toHaveBeenCalled();
});
