import "server-only";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { cashReportRepository } from "@/repositories/firestore/cash-report";
import { createCashReportService } from "@/services/cash-report";
export function getCashReportService() { return createCashReportService(cashReportRepository(getFirebaseAdmin().firestore)); }
