import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Banknote, Download, Receipt, RotateCcw, CalendarDays, Info } from "lucide-react";
import type { CashReport } from "@/domain/models/cash-report";
import { formatCashAmount } from "@/domain/models/payment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FinanceHero, FinanceAction, financeSurface as surface, financeMuted as muted, financeLink } from "./finance-layout";

export function CashOverview({ report, after }: { report: CashReport; after?: string }) {
  const { month, summary, entries } = report;
  const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T12:00:00Z`));
  return <>
    <FinanceHero title="Encaissements" description="Une vision claire des espèces reçues, des corrections et du journal de chaque abonnement." icon={Banknote}>
      <FinanceAction href="/crm/forfaits">Enregistrer un encaissement</FinanceAction><FinanceAction href="/crm/encaissements/soldes">Vérifier les soldes</FinanceAction>
    </FinanceHero>
    <section className={`${surface} flex flex-wrap items-end justify-between gap-5 p-5`} aria-label="Période du rapport">
      <form action="/crm/encaissements" className="flex flex-wrap items-end gap-3"><div className="space-y-2"><label className={`flex items-center gap-2 text-xs ${muted}`} htmlFor="cash-month"><CalendarDays size={14} />Mois de réception</label><Input className="h-11 rounded-xl" id="cash-month" name="month" type="month" min="2000-01" max="2099-12" required defaultValue={month} /></div><Button className="h-11 rounded-xl" type="submit">Afficher</Button></form>
      <a href={`/api/encaissements/export?${new URLSearchParams({ month })}`} className={financeLink}><Download size={15} />Exporter le mois en CSV</a>
    </section>
    <section aria-label={`Synthèse de ${monthLabel}`}><p className={`mb-3 text-xs capitalize ${muted}`}>{monthLabel} · Mois complet, toutes pages confondues</p><dl className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-[#b7893b]/35 bg-[#e9ddc4] p-5 dark:bg-[#302819]"><dt className="flex items-center justify-between gap-3 text-xs">Espèces retenues<Banknote size={20} className="text-[#896127] dark:text-[#d8b97f]" /></dt><dd data-testid="cash-net" className="mt-5 break-words font-serif text-3xl tabular-nums">{formatCashAmount(summary.netMinor)}</dd><p className={`mt-3 text-xs ${muted}`}>{summary.count} encaissement(s) conservé(s), après corrections</p></div>
      <div className={`${surface} p-5`}><dt className={`flex items-center justify-between gap-3 text-xs ${muted}`}>Saisies annulées<RotateCcw size={18} /></dt><dd className="mt-5 break-words font-serif text-3xl tabular-nums">{formatCashAmount(summary.correctedMinor)}</dd><p className={`mt-3 text-xs ${muted}`}>{summary.correctedCount} correction(s), exclue(s) du total</p></div>
      <div className={`${surface} p-5`}><dt className={`flex items-center justify-between gap-3 text-xs ${muted}`}>Total d’origine<Receipt size={18} /></dt><dd className="mt-5 break-words font-serif text-3xl tabular-nums">{formatCashAmount(summary.grossMinor)}</dd><p className={`mt-3 text-xs ${muted}`}>Avant annulation des erreurs de saisie</p></div>
    </dl></section>
    <section className={`${surface} overflow-hidden`} aria-labelledby="cash-ledger-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#b7893b]/15 p-5 sm:p-6"><div><h2 id="cash-ledger-title" className="font-serif text-2xl">Journal des encaissements</h2><p className={`mt-2 text-xs ${muted}`}>Espèces reçues selon la date de réception à Alger.</p></div><span className={`rounded-full bg-[#b7893b]/10 px-3 py-1.5 text-xs ${muted}`}>{entries.length} écriture(s) sur cette page</span></div>
      {entries.length === 0 ? <div className="px-6 py-16 text-center"><Receipt size={32} strokeWidth={1.2} className="mx-auto mb-4 text-[#b7893b]" /><h3 className="font-serif text-2xl">Aucun encaissement renseigné</h3><p className={`mt-2 text-sm ${muted}`}>Aucune écriture pour ce mois sur cette page.</p><Link className={`${financeLink} mt-5`} href="/crm/forfaits">Choisir une cliente<ArrowRight size={14} /></Link></div> : <ul className="divide-y divide-[#b7893b]/10">{entries.map(entry => <li key={`${entry.clientId}/${entry.subscriptionId}/${entry.id}`} className="flex flex-wrap items-center gap-4 p-5 transition hover:bg-[#b7893b]/[0.03] sm:px-6">
        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#b7893b]/10 text-[#957035] dark:text-[#d8b97f]"><Receipt size={20} strokeWidth={1.4} /></span>
        <div className="min-w-0 flex-1 basis-40"><h3 className="break-words text-sm font-semibold">{entry.clientName}</h3><p className={`mt-1.5 text-xs ${muted}`}><time dateTime={entry.receivedDate}>{entry.receivedDate.split("-").reverse().join("/")}</time> · Espèces</p></div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6"><div className="text-right"><p className={`text-sm font-semibold tabular-nums ${entry.corrected ? `line-through ${muted}` : "text-[#886125] dark:text-[#e0bd80]"}`}>{formatCashAmount(entry.amountMinor)}</p><span className={`mt-1.5 inline-block rounded-full px-2 py-1 text-[10px] ${entry.corrected ? "bg-stone-500/10 text-stone-600 dark:text-stone-300" : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"}`}>{entry.corrected ? "Annulée · exclue du total" : "Conservée"}</span></div><Link className={financeLink} href={`/crm/clientes/${entry.clientId}/abonnements/${entry.subscriptionId}/paiements`} aria-label={`Journal de l’abonnement de ${entry.clientName}`}>Journal<ArrowUpRight size={14} /></Link></div>
      </li>)}</ul>}
      <nav aria-label="Pagination des encaissements du centre" className="flex flex-wrap items-center justify-between gap-3 border-t border-[#b7893b]/15 p-5"><p className={`text-xs ${muted}`}>{report.next ? "D’autres écritures sont disponibles." : "Fin du journal pour cette période."}</p><div className="flex flex-wrap gap-2">{after && <Link className={financeLink} href={`/crm/encaissements?${new URLSearchParams({ month })}`}><ArrowLeft size={14} />Première page</Link>}{report.next && <Link className={financeLink} href={`/crm/encaissements?${new URLSearchParams({ month, after: report.next })}`}>Encaissements suivants<ArrowRight size={14} /></Link>}</div></nav>
    </section>
    <p className={`flex items-start gap-3 text-xs leading-6 ${muted}`}><Info size={17} className="mt-1 shrink-0" /><span>Les totaux et le CSV couvrent le mois complet. Une correction ultérieure actualise le mois de réception d’origine. Ce récapitulatif ne constitue ni un solde de caisse ni une liste d’impayés.</span></p>
  </>;
}
