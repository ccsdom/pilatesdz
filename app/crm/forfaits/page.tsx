import { StudioPricing } from "@/features/packages/studio-pricing";
import Link from "next/link";
import { getPageAccess } from "@/lib/auth/page-access";
import { getClientService } from "@/lib/clients/server";
import { ClientShell } from "@/features/clients/client-shell";
import { AccessErrorView } from "@/features/auth/access-error";
import { ManagementError } from "@/domain/ports/access-management";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  return <ClientShell centerId={result.access.centerId} active="packages"><h1 className="font-serif text-4xl">Forfaits et crédits</h1><p>Choisissez une cliente pour consulter ses crédits ou attribuer un forfait. Aucun paiement n’est enregistré.</p><StudioPricing /><form action="/crm/forfaits" className="space-y-3"><label htmlFor="package-client-search">Rechercher une cliente</label><div className="flex gap-3"><Input id="package-client-search" name="q" defaultValue={q} maxLength={254} /><Button type="submit">Rechercher</Button></div></form><section className="space-y-3">{page.clients.map((client) => <Link className="block rounded-2xl border bg-[#fffdf9] p-5" key={client.id} href={`/crm/clientes/${client.id}/forfaits`}><h2 className="font-semibold">{client.name}</h2><p className="text-sm text-muted-foreground">{client.email} · Consulter les forfaits</p></Link>)}{page.clients.length === 0 && <p>Aucune cliente trouvée.</p>}</section><nav className="flex gap-6 text-sm underline" aria-label="Pagination des clientes">{params.after && <Link href={`/crm/forfaits?${new URLSearchParams({ q })}`}>Première page</Link>}{page.next && <Link href={`/crm/forfaits?${new URLSearchParams({ q, after: page.next })}`}>Page suivante</Link>}</nav></ClientShell>;
}
