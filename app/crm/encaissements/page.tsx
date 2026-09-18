import Link from "next/link";
import { getPageAccess } from "@/lib/auth/page-access";
import { getCashReportService } from "@/lib/packages/cash-report";
import { getRequestTime } from "@/lib/request-time";
import { studioDay } from "@/domain/models/planning";
import { formatCashAmount } from "@/domain/models/payment";
import { ManagementError } from "@/domain/ports/access-management";
import { ClientShell } from "@/features/clients/client-shell";
import { AccessErrorView } from "@/features/auth/access-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, WalletCards, Receipt } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Encaissements du centre — Pilates Center Alger", robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ month?: string; after?: string }> }) {
  const result = await getPageAccess(["admin"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  const params = await searchParams;
  const month = typeof params.month === "string" ? params.month : studioDay(getRequestTime()).slice(0, 7);
  const after = typeof params.after === "string" ? params.after : undefined;
  let report;
  try { report = await getCashReportService().get(result.access, month, after); }
  catch (error) { return <AccessErrorView message={error instanceof ManagementError ? error.message : "Récapitulatif des encaissements temporairement indisponible."} />; }
  return <ClientShell centerId={result.access.centerId} active="cash">
    <header className="space-y-3"><div className="flex items-center gap-3"><CreditCard className="h-8 w-8 text-[#b7893b]" /><h1 className="font-serif text-4xl">Encaissements du centre</h1></div><p>Espèces déclarées reçues pendant le mois sélectionné, selon leur date de réception à Alger.</p><div className="flex flex-wrap items-center gap-4"><Link href="/crm/forfaits" className="inline-flex items-center gap-1.5 underline"><WalletCards className="h-4 w-4" />Enregistrer des espèces pour une cliente</Link><Link href="/crm/encaissements/soldes" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8d6729] underline"><Receipt className="h-4 w-4" />Soldes des abonnements à vérifier</Link></div></header>
    <form action="/crm/encaissements" className="flex flex-wrap items-end gap-3"><div className="space-y-2"><label htmlFor="cash-month">Mois de réception</label><Input id="cash-month" name="month" type="month" min="2000-01" max="2099-12" required defaultValue={month} /></div><Button type="submit">Afficher</Button></form>
    <dl className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border bg-[#fffdf9] p-5"><dt>Espèces enregistrées, après corrections</dt><dd data-testid="cash-net" className="mt-3 text-2xl text-[#8b652b]">{formatCashAmount(report.summary.netMinor)}</dd><p className="mt-2 text-sm">{report.summary.count} encaissement(s) conservé(s)</p></div>
      <div className="rounded-2xl border bg-[#fffdf9] p-5"><dt>Saisies annulées</dt><dd className="mt-3 text-2xl">{formatCashAmount(report.summary.correctedMinor)}</dd><p className="mt-2 text-sm">{report.summary.correctedCount} correction(s), exclue(s) du total</p></div>
      <div className="rounded-2xl border bg-[#fffdf9] p-5"><dt>Total des saisies d’origine</dt><dd className="mt-3 text-2xl">{formatCashAmount(report.summary.grossMinor)}</dd><p className="mt-2 text-sm">Avant annulation des erreurs</p></div>
    </dl>
    <p className="text-sm text-muted-foreground">Les totaux couvrent toutes les pages du mois. Une correction ultérieure actualise le mois de réception d’origine. Ce récapitulatif ne constitue ni un solde de caisse ni une liste d’impayés.</p>
    <section className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-serif text-2xl">Détail des encaissements</h2><a href={`/api/encaissements/export?${new URLSearchParams({ month })}`} className="rounded-xl border border-[#cdae72] px-4 py-2 text-sm font-semibold">Exporter le mois en CSV</a></div><p className="text-sm text-muted-foreground">Le CSV contient le mois complet, avec une colonne de montants retenus après corrections. Il peut être ouvert dans un tableur.</p>
      {report.entries.length === 0 && <p>Aucun encaissement renseigné pour ce mois.</p>}
      {report.entries.map(entry => <article key={`${entry.clientId}/${entry.subscriptionId}/${entry.id}`} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-[#fffdf9] p-4"><div><h3 className="font-semibold">{entry.clientName}</h3><p className="text-sm">Espèces reçues le {entry.receivedDate}</p><p className={entry.corrected ? "line-through" : "text-[#8b652b]"}>{formatCashAmount(entry.amountMinor)}</p>{entry.corrected && <p className="text-sm">Saisie annulée · exclue du total</p>}</div><Link className="text-sm underline" href={`/crm/clientes/${entry.clientId}/abonnements/${entry.subscriptionId}/paiements`}>Journal de l’abonnement</Link></article>)}
      <nav aria-label="Pagination des encaissements du centre" className="flex gap-5 underline">{after && <Link href={`/crm/encaissements?${new URLSearchParams({ month })}`}>Première page</Link>}{report.next && <Link href={`/crm/encaissements?${new URLSearchParams({ month, after: report.next })}`}>Encaissements suivants</Link>}</nav>
    </section>
  </ClientShell>;
}
