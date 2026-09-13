import { expect, it } from "vitest";
import { quarterlyPrice } from "../../src/domain/models/studio-offers";
it.each([[12000, 28800], [20000, 48000]])("applies the quarterly discount to three monthly payments of %i DA", (monthly, expected) => {
  expect(quarterlyPrice(monthly)).toBe(expected);
});
it.each([-1, NaN, Infinity, 12.5])("rejects invalid monthly price %s", value => {
  expect(() => quarterlyPrice(value)).toThrow();
});
