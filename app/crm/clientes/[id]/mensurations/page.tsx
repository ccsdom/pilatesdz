import Link from "next/link";
import { ArrowLeft, Ruler } from "lucide-react";
import { getPageAccess } from "@/lib/auth/page-access";
import { getClientService } from "@/lib/clients/server";
import { getMeasurementService } from "@/lib/clients/measurements";
import { ClientShell } from "@/features/clients/client-shell";
import { MeasurementsPanel } from "@/features/clients/measurements-panel";
import { AccessErrorView } from "@/features/auth/access-error";
import { ManagementError } from "@/domain/ports/access-management";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Mensurations — Pilates Center Alger", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const result = await getPageAccess(["admin", "manager"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  const { id } = await params;
  let details, initial;
  try {
    details = await getClientService().get(result.access, id);
    initial = await getMeasurementService().list(result.access, id);
  } catch (error) { return <AccessErrorView message={error instanceof ManagementError ? error.message : "Le suivi des mensurations est temporairement indisponible."} />; }
    return <ClientShell centerId={result.access.centerId}><Link href={`/crm/clientes/${id}`} className="inline-flex items-center gap-2 text-xs text-[#957035] dark:text-[#dbb97e]"><ArrowLeft size={14} />Retour à la fiche cliente</Link><header><p className="mb-3 flex items-center gap-2 text-xs text-[#957035] dark:text-[#dbb97e]"><Ruler size={16} />Suivi des mensurations</p><h1 className="break-words font-serif text-4xl">{details.profile.name}</h1></header><MeasurementsPanel clientId={id} initial={initial} /></ClientShell>;
}
