import Link from "next/link";
import { getPageAccess } from "@/lib/auth/page-access";
import { getClientService } from "@/lib/clients/server";
import { ClientShell } from "@/features/clients/client-shell";
import { ClientForm } from "@/features/clients/client-form";
import { ClientInvitation } from "@/features/clients/client-invitation";
import { AccessErrorView } from "@/features/auth/access-error";
import { ManagementError } from "@/domain/ports/access-management";
import { WalletCards, History } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Fiche cliente — Pilates Center Alger", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const result = await getPageAccess(["admin"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  let details;
  try { details = await getClientService().get(result.access, (await params).id); }
  catch (error) { return <AccessErrorView message={error instanceof ManagementError ? error.message : "La fiche cliente est temporairement indisponible."} />; }
  return <ClientShell centerId={result.access.centerId}><header className="space-y-3"><Link href="/crm/clientes" className="text-sm underline">Toutes les clientes</Link><h1 className="break-words font-serif text-4xl sm:text-5xl">{details.profile.name}</h1><p className="text-sm text-muted-foreground">Fiche du centre · Coordonnées et accès</p></header><div className="flex flex-wrap items-center gap-3"><Link href={`/crm/clientes/${details.profile.id}/forfaits`} className="inline-flex items-center gap-2 rounded-xl bg-[#b7893b] px-5 py-3 text-sm font-medium text-black"><WalletCards className="h-4 w-4" />Forfaits et crédits</Link><Link href={`/crm/clientes/${details.profile.id}/historique`} className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium"><History className="h-4 w-4" />Historique et assiduité</Link></div><ClientForm key={details.profile.id} profile={details.profile} /><ClientInvitation details={details} /></ClientShell>;
}

