import { expect, it, vi } from "vitest";
import { cashReportCsv } from "../../src/services/cash-report-csv";
import { createCashReportService } from "../../src/services/cash-report";
import { summarizeCash, type CashReport, type CashReportEntry } from "../../src/domain/models/cash-report";
const entry: CashReportEntry = { id: "p", subscriptionId: "s", clientId: "c", clientName: "Sarah", amountMinor: 12501, receivedDate: "2024-02-29", corrected: false };
function report(entries = [entry]): CashReport { return { month: "2024-02", entries, next: null, summary: summarizeCash(entries) }; }
it("exports exact centimes, cancelled entries and French CSV delimiters", () => {
  const csv = cashReportCsv(report([entry, { ...entry, id: "cancelled", corrected: true }]));
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain('"125,01";"125,01"'); expect(csv).toContain('"Saisie annulée";"125,01";"0,00"');
  expect(csv.split("\r\n")).toHaveLength(4);
});
it("escapes quotes and separators without creating new rows", () => {
  const csv = cashReportCsv(report([{ ...entry, clientName: 'Sarah; "A"\r\nX' }]));
  expect(csv).toContain('"Sarah; ""A""  X"'); expect(csv.split("\r\n")).toHaveLength(3);
});
it.each(["=1+1", " +1", "-1", "@SUM(A1)", "\t=1+1", "\u200B=1+1", "＝1+1"])("neutralizes formula-like customer text %s", name => {
  expect(cashReportCsv(report([{ ...entry, clientName: name }]))).toContain(';"\t');
});
it("refuses partial reports and exports a header for empty months", () => {
  expect(() => cashReportCsv({ ...report(), next: "cursor" })).toThrow();
  expect(() => cashReportCsv({ ...report(), entries: [] })).toThrow();
  expect(cashReportCsv(report([])).split("\r\n")).toHaveLength(2);
});
it("exports the whole month through the authorized service in one read", async () => {
  const repository = { get: vi.fn().mockResolvedValue(report()) };
  const service = createCashReportService(repository);
  const actor = { uid: "admin", role: "admin" as const, centerId: "alger" };
  await expect(service.exportCsv({ ...actor, role: "client" }, "2024-02")).rejects.toThrow();
  await expect(service.exportCsv(actor, "bad")).rejects.toThrow();
  expect(repository.get).not.toHaveBeenCalled();
  expect(await service.exportCsv(actor, "2024-02")).toContain("Sarah");
  expect(repository.get).toHaveBeenCalledWith(actor, "2024-02", undefined, "month");
});
