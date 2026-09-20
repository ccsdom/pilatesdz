import { describe, expect, it, vi } from "vitest";
import { clientInputSchema, clientSearchPrefixes, normalizeSearch, type ClientProfile } from "../../src/domain/models/client";
import { createClientService } from "../../src/services/clients";
import { ManagementError } from "../../src/domain/ports/access-management";
import type { Access } from "../../src/domain/models/access";
import { clientsCsv } from "../../src/domain/models/client-directory";

const admin: Access = { uid: "admin", centerId: "alger", role: "admin" };
const input = { name: "Émilie Ben-Ali", email: "emilie@pilates.test", phone: "+213 550 12 34 56", status: "active" as const };
const profile: ClientProfile = { ...input, id: "client", centerId: "alger", authUid: null, invitationUid: "reserved", version: 1, createdAt: 1, updatedAt: 1 };
function setup() {
  const repository = { create: vi.fn().mockResolvedValue(profile), update: vi.fn(), get: vi.fn(), list: vi.fn(), reserveInvitation: vi.fn().mockResolvedValue(profile), releaseInvitation: vi.fn(), link: vi.fn() };
  const accounts = { create: vi.fn().mockResolvedValue("reserved"), invitation: vi.fn().mockResolvedValue("local-link") };
  return { repository, accounts, service: createClientService(repository, accounts) };
}
describe("directory", () => {
  it("finds matching profiles beyond the first repository page", async () => {
    const { service, repository } = setup();
    repository.list.mockResolvedValueOnce({ clients: [{ ...profile, status: "inactive" }], next: "cursor" })
      .mockResolvedValueOnce({ clients: [profile], next: null });
    expect(await service.directory(admin, "emi", undefined, { status: "active", contact: "phone" })).toEqual({ clients: [profile], next: null });
    expect(repository.list).toHaveBeenLastCalledWith(admin, "emi", "cursor");
  });
  it("bounds sparse scans and returns a resumable cursor", async () => {
    const { service, repository } = setup();
    repository.list.mockResolvedValue({ clients: [profile], next: "next" });
    expect(await service.directory(admin, "", undefined, { status: "all", contact: "missing-phone" })).toEqual({ clients: [], next: "next" });
    expect(repository.list).toHaveBeenCalledTimes(10);
  });
  it("authorizes filtered listing before accessing data", async () => {
    const { service, repository } = setup();
    await expect(service.directory({ ...admin, role: "client" })).rejects.toMatchObject({ status: 403 });
    expect(repository.list).not.toHaveBeenCalled();
  });
  it("escapes separators, quotes and spreadsheet formulas in exports", () => {
    const csv = clientsCsv([{ ...profile, name: '=HYPERLINK("x");test' }]);
    expect(csv).toContain('"\'=HYPERLINK(""x"");test"');
    expect(csv).toContain('"\'+213 550 12 34 56"');
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });
});
describe("client profiles", () => {
  it("normalizes names, accents and formatted phone searches", () => {
    const prefixes = clientSearchPrefixes(input);
    for (const search of ["ÉMI", "BEN", "ali", "+213 (550)", "emilie@pilates"]) expect(prefixes).toContain(normalizeSearch(search));
    expect(prefixes).not.toContain("milie");
  });
  it.each([
    { ...input, name: "   " }, { ...input, email: "bad" }, { ...input, phone: "abc123456" },
    { ...input, phone: "123" }, { ...input, phone: "1".repeat(16) }, { ...input, status: "admin" },
    { ...input, centerId: "oran" }, { ...input, authUid: "someone" },
  ])("rejects invalid or privileged profile fields %j", (value) => { expect(clientInputSchema.safeParse(value).success).toBe(false); });
  it("accepts an optional phone and normalizes email", async () => {
    const { service, repository } = setup();
    await service.create(admin, { ...input, email: " EMILIE@PILATES.TEST ", phone: "" });
    expect(repository.create).toHaveBeenCalledWith(admin, { ...input, email: input.email, phone: "" });
  });
  it("blocks every administrative operation for clients before touching data", async () => {
    const { service, repository } = setup();
    const actor: Access = { ...admin, role: "client" };
    expect(() => service.create(actor, input)).toThrow();
    expect(() => service.update(actor, "client", 1, input)).toThrow();
    expect(() => service.get(actor, "client")).toThrow();
    expect(() => service.list(actor)).toThrow();
    await expect(service.invite(actor, "client")).rejects.toMatchObject({ status: 403 });
    for (const call of Object.values(repository)) expect(call).not.toHaveBeenCalled();
  });
  it("rejects path traversal and invalid versions", () => {
    const { service } = setup();
    expect(() => service.get(admin, "../members")).toThrow();
    expect(() => service.update(admin, "client", 0, input)).toThrow();
  });
  it("reuses the reserved UID and links before generating a code", async () => {
    const { service, repository, accounts } = setup();
    await service.invite(admin, "client");
    expect(accounts.create).toHaveBeenCalledWith(input.email, input.name, "reserved");
    expect(repository.link).toHaveBeenCalledWith(admin, "client", "reserved");
    expect(repository.link.mock.invocationCallOrder[0]).toBeLessThan(accounts.invitation.mock.invocationCallOrder[0]);
  });
  it("retains the reservation after an uncertain Auth failure", async () => {
    const { service, repository, accounts } = setup(); accounts.create.mockRejectedValue(new Error("Network"));
    await expect(service.invite(admin, "client")).rejects.toThrow();
    expect(repository.releaseInvitation).not.toHaveBeenCalled(); expect(repository.link).not.toHaveBeenCalled();
  });
  it("releases the reservation after a definite account conflict", async () => {
    const { service, repository, accounts } = setup(); accounts.create.mockRejectedValue(new ManagementError(409, "Conflict"));
    await expect(service.invite(admin, "client")).rejects.toThrow();
    expect(repository.releaseInvitation).toHaveBeenCalledWith(admin, "client", "reserved");
  });
  it("does not create another identity for a linked profile", async () => {
    const { service, repository, accounts } = setup(); repository.reserveInvitation.mockResolvedValue({ ...profile, authUid: "linked" });
    await service.invite(admin, "client"); expect(accounts.create).not.toHaveBeenCalled();
    expect(repository.link).toHaveBeenCalledWith(admin, "client", "linked");
  });
  it("never issues a link when final authorization fails", async () => {
    const { service, repository, accounts } = setup(); repository.link.mockRejectedValue(new Error("Membership changed"));
    await expect(service.invite(admin, "client")).rejects.toThrow(); expect(accounts.invitation).not.toHaveBeenCalled();
  });
});
