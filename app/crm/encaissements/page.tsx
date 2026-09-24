import { getPageAccess } from "@/lib/auth/page-access";
import { getCashReportService } from "@/lib/packages/cash-report";
import { getRequestTime } from "@/lib/request-time";
import { studioDay } from "@/domain/models/planning";
import { ManagementError } from "@/domain/ports/access-management";
import { ClientShell } from "@/features/clients/client-shell";
import { AccessErrorView } from "@/features/auth/access-error";
import { CashOverview } from "@/features/packages/cash-overview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Encaissements du centre — Pilates Center Alger", robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ month?: string; after?: string }> }) {
  const result = await getPageAccess(["admin", "manager"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  const params = await searchParams;
  const month = typeof params.month === "string" ? params.month : studioDay(getRequestTime()).slice(0, 7);
  const after = typeof params.after === "string" ? params.after : undefined;
  let report;
  try { report = await getCashReportService().get(result.access, month, after); }
  catch (error) { return <AccessErrorView message={error instanceof ManagementError ? error.message : "Récapitulatif des encaissements temporairement indisponible."} />; }
  return <ClientShell centerId={result.access.centerId} active="cash"><CashOverview report={report} after={after} /></ClientShell>;
}
