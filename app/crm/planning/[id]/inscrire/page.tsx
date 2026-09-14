import Link from "next/link";
import { getPageAccess } from "@/lib/auth/page-access";
import { getPlanningService } from "@/lib/planning/server";
import { getClientService } from "@/lib/clients/server";
import { getRequestTime } from "@/lib/request-time";
import { displaySessionTime } from "@/domain/models/planning";
import { ManagementError } from "@/domain/ports/access-management";
import { ClientShell } from "@/features/clients/client-shell";
import { AccessErrorView } from "@/features/auth/access-error";
import { AdminBooking } from "@/features/planning/admin-booking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Inscrire une cliente — Pilates Center Alger", robots: { index: false, follow: false } };
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; after?: string }> }) {
  const result = await getPageAccess(["admin"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  const { id } = await params;
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q.trim() : "";
  let details, page;
  try {
    details = await getPlanningService().get(result.access, id);
    if (details.session.status !== "scheduled" || details.session.startsAt <= getRequestTime()) throw new ManagementError(409, "Cette séance n’est plus ouverte aux inscriptions.");
    page = await getClientService().list(result.access, q, typeof query.after === "string" ? query.after : undefined);
  } catch (error) { return <AccessErrorView message={error instanceof ManagementError ? error.message : "Les inscriptions sont temporairement indisponibles."} />; }
  const { session, attendees } = details;
  const full = session.bookedCount >= session.capacity;
  const path = `/crm/planning/${id}/inscrire`;
  const next = new URLSearchParams({ q, ...(page.next ? { after: page.next } : {}) });
  return <ClientShell centerId={result.access.centerId} active="planning">
    <header className="space-y-3"><Link href={`/crm/planning/${id}`} className="text-sm underline">Retour à la séance</Link><h1 className="font-serif text-4xl">Inscrire une cliente</h1><p>{session.title} · {displaySessionTime(session.startsAt)} · Heure d’Alger</p><p>{session.capacity - session.bookedCount} place(s) disponible(s)</p><p className="text-sm text-muted-foreground">Un crédit valable sera utilisé. La cliente peut être inscrite sans avoir encore activé son accès en ligne.</p></header>
    {full && <p role="status">Cette séance est complète.</p>}
    <form action={path} className="space-y-3"><label htmlFor="booking-search" className="block text-sm font-medium">Rechercher par début de nom, e-mail ou téléphone</label><div className="flex flex-wrap gap-3"><Input key={q} id="booking-search" name="q" defaultValue={q} maxLength={254} className="min-w-0 flex-1 basis-60" /><Button type="submit">Rechercher</Button></div></form>
    <section aria-label="Clientes à inscrire" className="space-y-4">{page.clients.length === 0 && <p>Aucune cliente trouvée. Essayez une autre recherche.</p>}{page.clients.map(client => <article key={client.id} className="space-y-3 rounded-2xl border border-[#ded4c3] bg-[#fffdf9] p-5"><h2 className="break-words font-medium">{client.name}</h2><p className="break-all text-sm text-muted-foreground">{client.email}</p>{attendees.some(a => a.clientId === client.id) ? <p className="text-sm">Déjà inscrite à cette séance</p> : client.status !== "active" ? <p className="text-sm">Fiche inactive</p> : !full && <AdminBooking sessionId={id} clientId={client.id} name={client.name} />}</article>)}</section>
    <nav aria-label="Pagination des clientes" className="flex gap-6 text-sm underline">{query.after && <Link href={`${path}?${new URLSearchParams({ q })}`}>Première page</Link>}{page.next && <Link href={`${path}?${next}`}>Page suivante</Link>}</nav>
  </ClientShell>;
}
