import { expect, it, vi } from "vitest";
import { summarizeCash } from "../../src/domain/models/cash-report";
import { createCashReportService } from "../../src/services/cash-report";
it("loads the complete month for charts and returns only aggregated values", async () => {
  const entries = Array.from({ length: 75 }, () => ({ receivedDate: "2026-09-01", amountMinor: 100, corrected: false, clientName: "Private name" }));
  const repository = { get: vi.fn().mockResolvedValue({ entries, next: null }) };
  const actor = { uid: "admin", role: "admin" as const, centerId: "alger" };
  const service = createCashReportService(repository);
  const report = await service.chart(actor, "2026-09");
  expect(repository.get).toHaveBeenCalledWith(actor, "2026-09", undefined, "month");
  expect(report.summary.netMinor).toBe(7500);
  expect(JSON.stringify(report)).not.toContain("Private name");
  await expect(service.chart({ ...actor, role: "client" }, "2026-09")).rejects.toMatchObject({ status: 403 });
  await expect(service.chart(actor, "bad")).rejects.toMatchObject({ status: 400 });
  expect(repository.get).toHaveBeenCalledTimes(1);
  repository.get.mockResolvedValueOnce({ entries, next: "partial" });
  await expect(service.chart(actor, "2026-09")).rejects.toMatchObject({ status: 409 });
});
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
