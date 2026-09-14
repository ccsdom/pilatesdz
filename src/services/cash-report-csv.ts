import type { CashReport } from "@/domain/models/cash-report";

function cell(value: string) {
  // Flatten control/format characters; prefix formula-like cells for Excel-oriented CSV viewing.
  const clean = value.replace(/[\p{Cc}\p{Cf}]/gu, " ");
  const safe = /^[=+@-]/u.test(clean.trimStart().normalize("NFKC")) ? `\t${clean.trimStart()}` : clean;
  return `"${safe.replace(/"/g, '""')}"`;
}
function amount(minor: number) {
  if (!Number.isSafeInteger(minor) || minor < 0) throw new Error("Invalid CSV amount");
  return `${Math.floor(minor / 100)},${String(minor % 100).padStart(2, "0")}`;
}
export function cashReportCsv(report: CashReport) {
  if (report.next !== null || report.entries.length !== report.summary.count + report.summary.correctedCount) throw new Error("Cannot export an incomplete month");
  const rows = [
    ["Mois de réception", "Date de réception", "Cliente", "Moyen", "État de la saisie", "Montant d’origine (DA)", "Montant retenu après corrections (DA)", "Référence encaissement", "Référence abonnement"],
    ...report.entries.map(entry => [report.month, entry.receivedDate, entry.clientName, "Espèces", entry.corrected ? "Saisie annulée" : "Conservée", amount(entry.amountMinor), amount(entry.corrected ? 0 : entry.amountMinor), entry.id, entry.subscriptionId]),
  ];
  return "\uFEFF" + rows.map(row => row.map(cell).join(";")).join("\r\n") + "\r\n";
}
