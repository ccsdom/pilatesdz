import { isCenterOperator } from "@/domain/models/access";
import { AccessError, type Access } from "@/domain/models/access";
import { cashMonthSchema } from "@/domain/models/cash-report";
import { ManagementError } from "@/domain/ports/access-management";
import type { CashReportRepository } from "@/domain/ports/cash-report";
import { cashReportCsv } from "./cash-report-csv";
import { monthlyCash } from "@/domain/models/dashboard-charts";
export function createCashReportService(repository: CashReportRepository) {
  return {
    async chart(actor: Access, month: string) {
      if (!isCenterOperator(actor.role)) throw new AccessError(403);
      if (!cashMonthSchema.safeParse(month).success) throw new ManagementError(400, "Choisissez un mois valide.");
      const report = await repository.get(actor, month, undefined, "month");
      if (report.next) throw new ManagementError(409, "Le graphique nécessite un mois complet.");
      return monthlyCash(month, report.entries);
    },
    async exportCsv(actor: Access, month: string) {
      if (!isCenterOperator(actor.role)) throw new AccessError(403);
      if (!cashMonthSchema.safeParse(month).success) throw new ManagementError(400, "Choisissez un mois valide.");
      return cashReportCsv(await repository.get(actor, month, undefined, "month"));
    },
    get(actor: Access, month: string, after?: string) {
      if (!isCenterOperator(actor.role)) throw new AccessError(403);
      if (!cashMonthSchema.safeParse(month).success) throw new ManagementError(400, "Choisissez un mois valide.");
      if (after !== undefined && !/^[A-Za-z0-9_-]{1,1024}$/.test(after)) throw new ManagementError(400, "Page invalide.");
      return repository.get(actor, month, after);
    },
  };
}
