import { expect, it } from "vitest";
import { isTrustedMutation, readLimitedBody } from "@/lib/auth/request-policy";
const origin = "http://127.0.0.1:3100";
it("accepts same-origin JSON only", () => {
  expect(isTrustedMutation(origin, "application/json", origin)).toBe(true);
  expect(isTrustedMutation(null, "application/json", origin)).toBe(false);
  expect(isTrustedMutation("https://evil.test", "application/json", origin)).toBe(false);
  expect(isTrustedMutation(origin, "text/plain", origin)).toBe(false);
  expect(isTrustedMutation(origin, "application/json", undefined)).toBe(false);
});
it("rejects oversized bodies without trusting Content-Length", async () => {
  const request = new Request(origin, { method: "POST", body: "x".repeat(12001) });
  await expect(readLimitedBody(request)).rejects.toThrow();
  expect(await readLimitedBody(new Request(origin, { method: "POST", body: "{}" }))).toBe("{}");
});
