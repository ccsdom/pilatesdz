import { expect, it, vi } from "vitest";
import { summarizeCash } from "../../src/domain/models/cash-report";
import { createCashReportService } from "../../src/services/cash-report";
it("reports an empty month without inventing revenue", () => {
  expect(summarizeCash([])).toEqual({ grossMinor: 0, correctedMinor: 0, netMinor: 0, count: 0, correctedCount: 0 });
});
it("subtracts corrected entries without rounding cents", () => {
  expect(summarizeCash([{ amountMinor: 105, corrected: false }, { amountMinor: 200, corrected: true }, { amountMinor: 1, corrected: false }]))
    .toEqual({ grossMinor: 306, correctedMinor: 200, netMinor: 106, count: 2, correctedCount: 1 });
});
it("rejects invalid amounts and unsafe accumulated totals", () => {
  expect(() => summarizeCash([{ amountMinor: -1, corrected: false }])).toThrow();
  expect(() => summarizeCash([{ amountMinor: Number.MAX_SAFE_INTEGER, corrected: false }, { amountMinor: 1, corrected: false }])).toThrow();
});
it("restricts monthly reports to administrators and validates month and cursor", () => {
  const repository = { get: vi.fn() }; const service = createCashReportService(repository);
  const actor = { uid: "admin", role: "admin" as const, centerId: "alger" };
  expect(() => service.get({ ...actor, role: "client" }, "2024-02")).toThrow();
  for (const month of ["2024-00", "2024-13", "2024-2", "bad"]) expect(() => service.get(actor, month)).toThrow();
  expect(() => service.get(actor, "2024-02", "../other")).toThrow();
  expect(repository.get).not.toHaveBeenCalled();
  service.get(actor, "2024-02"); expect(repository.get).toHaveBeenCalledWith(actor, "2024-02", undefined);
});
