import Link from "next/link";
import type { SubscriptionPage } from "@/domain/ports/subscriptions";
import { STUDIO_TIME_ZONE } from "@/domain/models/planning";
import { formatDzd } from "@/domain/models/studio-offers";

export function SubscriptionList({ page, now, basePath, after, packageAfter, paymentClientId }: {
  page: SubscriptionPage; now: number; basePath: string; after?: string; packageAfter?: string; paymentClientId?: string;
}) {
  const date = (value: number) => new Intl.DateTimeFormat("fr-FR", { timeZone: STUDIO_TIME_ZONE, dateStyle: "medium" }).format(value);
  const href = (cursor?: string) => {
    const query = new URLSearchParams();
    if (cursor) query.set("subscriptionAfter", cursor);
    if (packageAfter) query.set("after", packageAfter);
    return `${basePath}${query.size ? `?${query}` : ""}`;
  };
  return <section className="space-y-4">
    <h2 className="font-serif text-2xl">Abonnements attribués</h2>
    <p className="text-sm text-muted-foreground">Conditions enregistrées à l’attribution, du plus récent au plus ancien. Le tarif affiché ne constitue pas une confirmation de paiement.</p>
    {page.subscriptions.length === 0 && <p className="rounded-2xl border border-dashed p-6">Aucun abonnement attribué. Les éventuels crédits manuels figurent dans les forfaits ci-dessous.</p>}
    <div className="grid gap-4 sm:grid-cols-2">{page.subscriptions.map(subscription => {
      const first = subscription.periods[0], last = subscription.periods.at(-1)!;
      return <article key={subscription.id} className="space-y-3 rounded-2xl border border-[#ded4c3] bg-[#fffdf9] p-6">
        <h3 className="font-serif text-2xl">{first.credits} séances par mois · {subscription.term === "quarterly" ? "Trimestriel" : "Mensuel"}</h3>
        <p className="text-xl text-[#8b652b]">Tarif : {formatDzd(subscription.amountDzd)}</p>
        <p className="text-sm">Du {date(first.validFrom)} au {date(last.expiresAt - 1)} inclus</p>
        <p className="font-medium">{now >= last.expiresAt ? "Terminé" : now < first.validFrom ? "À venir" : "Période de validité en cours"}</p>
        <ol className="space-y-2 text-sm">{subscription.periods.map((period, index) => <li key={period.validFrom}>Mois {index + 1} : {date(period.validFrom)} – {date(period.expiresAt - 1)} · {period.credits} séances prévues</li>)}</ol>
        <p className="text-sm text-muted-foreground">Sans report ni renouvellement automatique. Les crédits restants sont indiqués dans les forfaits ci-dessous.</p>
        {paymentClientId && <Link href={`/crm/clientes/${paymentClientId}/abonnements/${subscription.id}/paiements`} className="inline-block text-sm font-semibold underline">Encaissements et solde</Link>}
      </article>;
    })}</div>
    <nav aria-label="Pagination des abonnements" className="flex gap-6 text-sm underline">
      {after && <Link href={href()}>Abonnements récents</Link>}
      {page.next && <Link href={href(page.next)}>Abonnements plus anciens</Link>}
    </nav>
  </section>;
}
