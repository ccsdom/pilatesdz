import type { Access } from "../models/access";
import type { CashReport } from "../models/cash-report";
export interface CashReportRepository {
  get(actor: Access, month: string, after?: string, scope?: "page" | "month"): Promise<CashReport>;
}
