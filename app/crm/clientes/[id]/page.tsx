import Link from "next/link";
import { getPageAccess } from "@/lib/auth/page-access";
import { getClientService } from "@/lib/clients/server";
import { ClientShell } from "@/features/clients/client-shell";
import { ClientForm } from "@/features/clients/client-form";
import { ClientInvitation } from "@/features/clients/client-invitation";
import { AccessErrorView } from "@/features/auth/access-error";
import { ManagementError } from "@/domain/ports/access-management";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Fiche cliente — Pilates Center Alger", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const result = await getPageAccess(["admin"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  let details;
  try { details = await getClientService().get(result.access, (await params).id); }
  catch (error) { return <AccessErrorView message={error instanceof ManagementError ? error.message : "La fiche cliente est temporairement indisponible."} />; }
  return <ClientShell centerId={result.access.centerId}><header className="space-y-3"><Link href="/crm/clientes" className="text-sm underline">Toutes les clientes</Link><h1 className="break-words font-serif text-4xl sm:text-5xl">{details.profile.name}</h1><p className="text-sm text-muted-foreground">Fiche du centre · Coordonnées et accès</p></header><ClientForm key={details.profile.id} profile={details.profile} /><ClientInvitation details={details} /></ClientShell>;
}
