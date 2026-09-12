import Link from "next/link";
import { Plus, Search, ArrowRight, UsersRound } from "lucide-react";
import { getPageAccess } from "@/lib/auth/page-access";
import { getClientService } from "@/lib/clients/server";
import { ClientShell } from "@/features/clients/client-shell";
import { AccessErrorView } from "@/features/auth/access-error";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ManagementError } from "@/domain/ports/access-management";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Clientes — Pilates Center Alger", robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; after?: string }> }) {
  const result = await getPageAccess(["admin"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  let page;
  try { page = await getClientService().list(result.access, q, typeof params.after === "string" ? params.after : undefined); }
  catch (error) { return <AccessErrorView message={error instanceof ManagementError ? error.message : "La liste des clientes est temporairement indisponible."} />; }
  const query = new URLSearchParams(q ? { q } : {});
  if (page.next) query.set("after", page.next);
  return <ClientShell centerId={result.access.centerId}>
    <header className="flex flex-wrap items-end justify-between gap-5"><div><p className="mb-2 text-sm text-[#957035]">Les clientes de votre centre</p><h1 className="font-serif text-5xl">Clientes</h1></div><Link href="/crm/clientes/nouvelle" className="inline-flex items-center gap-2 rounded-xl bg-[#111] px-5 py-3 text-sm font-medium text-white"><Plus size={18} className="text-[#d5ae65]" />Nouvelle cliente</Link></header>
    <form action="/crm/clientes" className="space-y-3 rounded-2xl border border-[#ded4c3] bg-[#fffdf9] p-5"><label htmlFor="client-search" className="block text-sm font-medium">Rechercher une cliente</label><div className="flex flex-wrap gap-3"><Input key={q} id="client-search" name="q" defaultValue={q} maxLength={254} placeholder="Nom, adresse e-mail ou téléphone" className="min-w-0 flex-1 basis-60" /><Button type="submit"><Search size={16} />Rechercher</Button>{q && <Link href="/crm/clientes" className="self-center text-sm underline">Effacer</Link>}</div><p className="text-xs leading-5 text-muted-foreground">Saisissez le début d’un nom, d’un prénom, d’une adresse ou d’un numéro. La recherche ignore les accents et la casse.</p></form>
    {page.clients.length === 0 ? <section className="rounded-2xl border border-dashed border-[#c9bda8] py-16 text-center"><UsersRound className="mx-auto mb-4 text-[#b7893b]" size={36} /><h2 className="font-serif text-2xl">{q ? "Aucune cliente trouvée" : "Votre annuaire commence ici"}</h2><p className="mt-3 px-5 text-sm text-muted-foreground">{q ? "Essayez un autre nom, e-mail ou numéro." : "Créez une fiche pour enregistrer les coordonnées d’une cliente."}</p></section> : <section aria-label="Liste des clientes" className="space-y-3">{page.clients.map((client) => <Link key={client.id} href={`/crm/clientes/${client.id}`} className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#ded4c3] bg-[#fffdf9] p-5 transition hover:border-[#b7893b]"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ede0c8] text-sm font-medium text-[#765522]" aria-hidden="true">{client.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase()}</span><div className="min-w-0 flex-1 basis-40"><h2 className="break-words font-semibold">{client.name}</h2><p className="break-all text-sm text-muted-foreground">{client.email}</p><p className="mt-1 text-sm text-muted-foreground">{client.phone || "Téléphone non renseigné"}</p></div><span className={`rounded-full px-3 py-1 text-xs ${client.status === "active" ? "bg-[#ede0c8] text-[#765522]" : "bg-gray-100 text-gray-600"}`}>{client.status === "active" ? "Fiche active" : "Fiche inactive"}</span><ArrowRight size={18} aria-hidden="true" /></Link>)}</section>}
    <nav aria-label="Pagination des clientes" className="flex flex-wrap gap-6 text-sm underline">{params.after && <Link href={`/crm/clientes${q ? `?${new URLSearchParams({ q })}` : ""}`}>Première page</Link>}{page.next && <Link href={`/crm/clientes?${query}`}>Page suivante</Link>}</nav>
  </ClientShell>;
}
