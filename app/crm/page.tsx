import { CrmPreview } from "@/features/crm/crm-preview";
import { getPageAccess } from "@/lib/auth/page-access";
import { AccessErrorView } from "@/features/auth/access-error";
import { LogoutButton } from "@/features/auth/logout-button";
import Link from "next/link";
import { getClientService } from "@/lib/clients/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = { title: "Aperçu CRM — Pilates Center Alger", robots: { index: false, follow: false } };

export default async function CrmPage() {
  const result = await getPageAccess(["admin"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  let clients;
  try { clients = (await getClientService().list(result.access)).clients.slice(0, 3); }
  catch { return <AccessErrorView message="Le CRM est temporairement indisponible." />; }
  return <><div className="flex flex-wrap items-center justify-between gap-3 bg-[#080808] px-5 py-4 text-sm text-[#d5ae65]"><span>Fiches clientes enregistrées localement · Planning et finances de démonstration</span><Link href="/crm/clientes" className="underline">Clientes</Link><Link href="/crm/acces" className="underline">Gestion des accès</Link><LogoutButton /></div><CrmPreview clients={clients} /></>;
}
