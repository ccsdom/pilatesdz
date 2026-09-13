import Link from "next/link";
import { getPageAccess } from "@/lib/auth/page-access";
import { getClientService } from "@/lib/clients/server";
import { getClientHistoryService } from "@/lib/client-history/server";
import { getRequestTime } from "@/lib/request-time";
import { studioDay } from "@/domain/models/planning";
import { ManagementError } from "@/domain/ports/access-management";
import { ClientShell } from "@/features/clients/client-shell";
import { AccessErrorView } from "@/features/auth/access-error";
import { ClientHistory } from "@/features/planning/client-history";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Historique cliente — Pilates Center Alger", robots: { index: false, follow: false } };
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ month?: string; after?: string }> }) {
  const result = await getPageAccess(["admin"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  const { id } = await params, query = await searchParams;
  const month = typeof query.month === "string" ? query.month : studioDay(getRequestTime()).slice(0, 7);
  const after = typeof query.after === "string" ? query.after : undefined;
  let profile, page;
  try { [profile, page] = await Promise.all([getClientService().get(result.access, id), getClientHistoryService().list(result.access, month, id, after)]); }
  catch (error) { return <AccessErrorView message={error instanceof ManagementError ? error.message : "Historique temporairement indisponible."} />; }
  return <ClientShell centerId={result.access.centerId}><Link href={`/crm/clientes/${id}`} className="text-sm underline">Retour à la fiche cliente</Link><h1 className="font-serif text-4xl">Historique · {profile.profile.name}</h1><ClientHistory page={page} admin basePath={`/crm/clientes/${id}/historique`} after={after} /></ClientShell>;
}
