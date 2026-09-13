import { expect, it, vi } from "vitest";
import { createPasswordEmailSender } from "../../src/services/password-email";

it("requests a private French reset email without exposing the provider response", async () => {
  const reserve = vi.fn().mockResolvedValue(undefined);
  const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ oobCode: "must-never-escape" }), { status: 200 }));
  const send = createPasswordEmailSender({ apiKey: "public-test-key", reserve, request });
  expect(await send("recipient@example.invalid")).toBeNull();
  expect(reserve).toHaveBeenCalledWith("recipient@example.invalid");
  const [url, options] = request.mock.calls[0];
  expect(url).toBe("https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=public-test-key");
  expect(JSON.parse(options.body)).toEqual({ requestType: "PASSWORD_RESET", email: "recipient@example.invalid" });
  expect(options.headers["X-Firebase-Locale"]).toBe("fr");
});
it("does not send when throttling refuses a reservation", async () => {
  const request = vi.fn();
  const send = createPasswordEmailSender({ apiKey: "key", reserve: vi.fn().mockRejectedValue(new Error("throttled")), request });
  await expect(send("recipient@example.invalid")).rejects.toThrow("throttled");
  expect(request).not.toHaveBeenCalled();
});
it("fails before reservation when the provider is not configured", async () => {
  const request = vi.fn(); const reserve = vi.fn();
  await expect(createPasswordEmailSender({ apiKey: "", reserve, request })("recipient@example.invalid")).rejects.toThrow("non configuré");
  expect(reserve).not.toHaveBeenCalled(); expect(request).not.toHaveBeenCalled();
});
it.each([400, 429, 500])("reports an unconfirmed delivery for HTTP %i", async status => {
  const request = vi.fn().mockResolvedValue(new Response("sensitive-provider-error", { status }));
  await expect(createPasswordEmailSender({ apiKey: "key", reserve: vi.fn(), request })("recipient@example.invalid")).rejects.toThrow("Envoi non confirmé");
});
it("keeps the retry delay on an uncertain network failure", async () => {
  const reserve = vi.fn(); const request = vi.fn().mockRejectedValue(new Error("sensitive-token"));
  await expect(createPasswordEmailSender({ apiKey: "key", reserve, request })("recipient@example.invalid")).rejects.toThrow("Envoi non confirmé");
  expect(reserve).toHaveBeenCalledTimes(1);
});
