import { z } from "zod";
export const cashMonthSchema = z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/);
export type CashReportEntry = { id: string; clientId: string; clientName: string; subscriptionId: string; receivedDate: string; amountMinor: number; corrected: boolean };
export function summarizeCash(entries: Pick<CashReportEntry, "amountMinor" | "corrected">[]) {
  let grossMinor = 0, correctedMinor = 0, count = 0;
  for (const entry of entries) {
    if (!Number.isSafeInteger(entry.amountMinor) || entry.amountMinor <= 0) throw new Error("Invalid cash amount");
    grossMinor += entry.amountMinor;
    if (entry.corrected) correctedMinor += entry.amountMinor; else count++;
    if (!Number.isSafeInteger(grossMinor)) throw new Error("Cash report exceeds safe precision");
  }
  return { grossMinor, correctedMinor, netMinor: grossMinor - correctedMinor, count, correctedCount: entries.length - count };
}
export type CashReport = { month: string; summary: ReturnType<typeof summarizeCash>; entries: CashReportEntry[]; next: string | null };
