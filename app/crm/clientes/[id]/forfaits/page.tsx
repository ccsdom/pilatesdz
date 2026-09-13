import { SubscriptionForm } from "@/features/packages/subscription-form";
import Link from "next/link";
import { getPageAccess } from "@/lib/auth/page-access";
import { getPackageService } from "@/lib/packages/server";
import { getClientService } from "@/lib/clients/server";
import { getRequestTime } from "@/lib/request-time";
import { studioDay } from "@/domain/models/planning";
import { ManagementError } from "@/domain/ports/access-management";
import { ClientShell } from "@/features/clients/client-shell";
import { AccessErrorView } from "@/features/auth/access-error";
import { PackageForm } from "@/features/packages/package-form";
import { PackageList } from "@/features/packages/package-list";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Forfaits cliente — Pilates Center Alger", robots: { index: false, follow: false } };
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ after?: string }> }) {
  const result = await getPageAccess(["admin"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  const { id } = await params;
  const query = await searchParams;
  const after = typeof query.after === "string" ? query.after : undefined;
  const now = getRequestTime();
  let profile, page;
  try { [profile, page] = await Promise.all([getClientService().get(result.access, id), getPackageService().list(result.access, id, after)]); }
  catch (error) { return <AccessErrorView message={error instanceof ManagementError ? error.message : "Forfaits temporairement indisponibles."} />; }
  return <ClientShell centerId={result.access.centerId} active="packages"><header className="space-y-3"><Link href={`/crm/clientes/${id}`} className="text-sm underline">Retour à la fiche cliente</Link><h1 className="font-serif text-4xl">Forfaits · {profile.profile.name}</h1></header>{profile.profile.status === "active" ? <><SubscriptionForm clientId={id} today={studioDay(now)} /><details className="rounded-2xl border p-5"><summary className="cursor-pointer font-medium">Forfait manuel ou crédits exceptionnels</summary><div className="mt-5"><PackageForm clientId={id} today={studioDay(now)} lastDay={studioDay(now + 29 * 86400000)} /></div></details></> : <p>Fiche inactive : réactivez-la pour attribuer un forfait.</p>}<PackageList page={page} now={now} after={after} basePath={`/crm/clientes/${id}/forfaits`} /></ClientShell>;
}
