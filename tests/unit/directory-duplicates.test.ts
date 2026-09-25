import { expect, it } from "vitest";
import { duplicateEmailGroups } from "../../src/domain/models/client-directory";

it("signals distinct records sharing a normalized email without merging them", () => {
  const clients = [{ id: "one", name: "One", email: "TEST@example.com " }, { id: "two", name: "Two", email: "test@example.com" }];
  expect(duplicateEmailGroups(clients)).toEqual([{ email: "test@example.com", clients }]);
});
it("ignores missing emails, unique addresses and repeat loads of the same record", () => {
  const one = { id: "one", name: "One", email: "test@example.com" };
  expect(duplicateEmailGroups([one, one, { id: "two", name: "Two", email: "" }, { id: "three", name: "Three", email: " " }])).toEqual([]);
});
