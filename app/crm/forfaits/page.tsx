import { StudioPricing } from "@/features/packages/studio-pricing";
import Link from "next/link";
import { getPageAccess } from "@/lib/auth/page-access";
import { getClientService } from "@/lib/clients/server";
import { ClientShell } from "@/features/clients/client-shell";
import { AccessErrorView } from "@/features/auth/access-error";
import { ManagementError } from "@/domain/ports/access-management";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WalletCards, Clock } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Forfaits — Pilates Center Alger", robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; after?: string }> }) {
  const result = await getPageAccess(["admin"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  let page;
  try { page = await getClientService().list(result.access, q, typeof params.after === "string" ? params.after : undefined); }
  catch (error) { return <AccessErrorView message={error instanceof ManagementError ? error.message : "Annuaire temporairement indisponible."} />; }
  return <ClientShell centerId={result.access.centerId} active="packages"><div className="flex items-center gap-3"><WalletCards className="h-8 w-8 text-[#b7893b]" /><h1 className="font-serif text-4xl">Forfaits et encaissements</h1></div><p>Choisissez une cliente pour consulter ses crédits, attribuer un abonnement ou ouvrir son journal d’encaissements.</p><Link href="/crm/forfaits/suivi" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8d6729] underline"><Clock className="h-4 w-4" />Échéances proches et crédits faibles</Link><StudioPricing /><form action="/crm/forfaits" className="space-y-3"><label htmlFor="package-client-search">Rechercher une cliente</label><div className="flex gap-3"><Input id="package-client-search" name="q" defaultValue={q} maxLength={254} /><Button type="submit">Rechercher</Button></div></form><section className="space-y-3">{page.clients.map((client) => <Link className="block rounded-2xl border bg-[#fffdf9] p-5" key={client.id} href={`/crm/clientes/${client.id}/forfaits`}><h2 className="font-semibold">{client.name}</h2><p className="text-sm text-muted-foreground">{client.email} · Abonnements, crédits et encaissements</p></Link>)}{page.clients.length === 0 && <p>Aucune cliente trouvée.</p>}</section><nav className="flex gap-6 text-sm underline" aria-label="Pagination des clientes">{params.after && <Link href={`/crm/forfaits?${new URLSearchParams({ q })}`}>Première page</Link>}{page.next && <Link href={`/crm/forfaits?${new URLSearchParams({ q, after: page.next })}`}>Page suivante</Link>}</nav></ClientShell>;
}

