"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { planSubscription, subscriptionInputSchema, type SubscriptionInput } from "@/domain/models/subscription";
import { formatDzd, MONTHLY_OFFERS } from "@/domain/models/studio-offers";
import { STUDIO_TIME_ZONE } from "@/domain/models/planning";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SubscriptionForm({ clientId, today }: { clientId: string; today: string }) {
  const router = useRouter();
  const requestId = useRef<string | null>(null);
  const [input, setInput] = useState<SubscriptionInput>({ offerId: "monthly-4", term: "monthly", purchaseDate: today });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const parsed = subscriptionInputSchema.safeParse(input);
  const plan = parsed.success ? planSubscription(parsed.data) : null;
  const date = (value: number) => new Intl.DateTimeFormat("fr-FR", { timeZone: STUDIO_TIME_ZONE, dateStyle: "medium" }).format(value);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || success || !plan) return;
    setBusy(true); setError("");
    try {
      requestId.current ??= crypto.randomUUID();
      const response = await fetch("/api/abonnements", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: requestId.current, clientId, subscription: input }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Attribution non confirmée."); return; }
      setSuccess(true); router.refresh();
    } catch { setError("Attribution non confirmée. Réessayez avec les mêmes informations ou rechargez pour vérifier les forfaits."); }
    finally { setBusy(false); }
  }
  if (success) return <section className="rounded-2xl border border-[#cdae72] bg-[#fffdf9] p-6"><p role="status">Abonnement attribué. Chaque période possède ses propres crédits, sans report. Aucun paiement enregistré.</p></section>;
  return <form onSubmit={submit} className="space-y-5 rounded-2xl border border-[#cdae72] bg-[#fffdf9] p-6">
    <h2 className="font-serif text-2xl">Attribuer un abonnement</h2>
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="subscription-offer">Formule</Label><select id="subscription-offer" className="h-10 w-full rounded-md border bg-transparent px-3" value={input.offerId} disabled={busy} onChange={event => setInput({ ...input, offerId: event.target.value as SubscriptionInput["offerId"] })}>{MONTHLY_OFFERS.map(offer => <option key={offer.id} value={offer.id}>{offer.sessionsPerMonth} séances par mois — {formatDzd(offer.priceDzd)}</option>)}</select></div>
      <div className="space-y-2"><Label htmlFor="subscription-term">Durée de l’abonnement</Label><select id="subscription-term" className="h-10 w-full rounded-md border bg-transparent px-3" value={input.term} disabled={busy} onChange={event => setInput({ ...input, term: event.target.value as SubscriptionInput["term"] })}><option value="monthly">Un mois</option><option value="quarterly">Trois mois — réduction de 20 %</option></select></div>
      <div className="space-y-2"><Label htmlFor="subscription-date">Date d’achat et de début</Label><Input id="subscription-date" type="date" required max={today} value={input.purchaseDate} disabled={busy} onChange={event => setInput({ ...input, purchaseDate: event.target.value })} /></div>
    </div>
    {plan && <div className="space-y-3 rounded-xl bg-[#f7efe4] p-4"><p>Tarif de l’abonnement : <strong>{formatDzd(plan.amountDzd)}</strong>{input.term === "quarterly" ? " pour trois mois, remise incluse." : " pour un mois."}</p><ol className="space-y-2">{plan.periods.map((period, index) => <li key={period.validFrom} className="text-sm">Période {index + 1} : du {date(period.validFrom)} au {date(period.expiresAt - 1)} inclus · {period.credits} séances</li>)}</ol></div>}
    <p className="text-sm leading-6 text-muted-foreground">Mois à compter de la date d’achat, selon les dates affichées et l’heure d’Alger. Les séances inutilisées ne sont pas reportées. L’attribution ouvre les crédits ; elle n’enregistre pas de paiement et ne déclenche aucun renouvellement automatique.</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="submit" disabled={busy || !plan}>{busy ? "Attribution…" : "Attribuer l’abonnement"}</Button>
  </form>;
}
