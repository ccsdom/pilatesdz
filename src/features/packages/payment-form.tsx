"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatCashAmount, parseCashAmount } from "@/domain/models/payment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PaymentForm({ clientId, subscriptionId, remaining, today, purchaseDate, clientName }: {
  clientId: string; subscriptionId: string; remaining: number; today: string; purchaseDate: string; clientName: string;
}) {
  const router = useRouter();
  const requestId = useRef<string | null>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [review, setReview] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const minor = parseCashAmount(amount);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || done || !minor || minor > remaining) return;
    if (!review) { setReview(true); return; }
    setBusy(true); setAttempted(true); setError("");
    requestId.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/encaissements", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, subscriptionId, requestId: requestId.current, payment: { amountMinor: minor, receivedDate: date, method: "cash" } }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Enregistrement non confirmé."); return; }
      if (result.payment?.correction) { setError("Cette saisie a été annulée. Rechargez le journal avant tout nouvel encaissement."); router.refresh(); return; }
      setDone(true); router.refresh();
    } catch { setError("Enregistrement non confirmé. Réessayez la même demande ou rechargez le journal avant toute nouvelle saisie."); }
    finally { setBusy(false); }
  }
  if (done) return <p role="status" className="rounded-xl border border-[#cdae72] p-5">Encaissement enregistré. Le journal et le solde ont été actualisés. Rechargez la page pour saisir un autre acompte.</p>;
  if (remaining === 0) return <p className="rounded-xl border p-5">Le tarif de cet abonnement est entièrement couvert par les encaissements enregistrés.</p>;
  return <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[#cdae72] bg-[#fffdf9] p-6">
    <h2 className="font-serif text-2xl">Enregistrer des espèces reçues</h2>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="cash-amount">Montant reçu en DA</Label><Input id="cash-amount" inputMode="decimal" required value={amount} disabled={review || attempted} onChange={event => setAmount(event.target.value)} placeholder="Ex. 5 000 : saisir 5000" /></div>
      <div className="space-y-2"><Label htmlFor="cash-date">Date de réception</Label><Input id="cash-date" type="date" required min={purchaseDate} max={today} value={date} disabled={review || attempted} onChange={event => setDate(event.target.value)} /></div>
    </div>
    {amount && (!minor || minor > remaining) && <p role="alert">Saisissez un montant positif, avec deux décimales maximum, inférieur ou égal au solde.</p>}
    {review && minor && <div className="rounded-xl bg-[#f7efe4] p-4"><p>Cliente : <strong>{clientName}</strong></p><p>Espèces reçues le {date} : <strong>{formatCashAmount(minor)}</strong>.</p><p>Solde après enregistrement : {formatCashAmount(remaining - minor)}.</p><p className="mt-2 text-sm">Confirmez uniquement si ces espèces ont réellement été reçues. Cette saisie ne modifie pas les crédits.</p></div>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div className="flex gap-3">{review && !attempted && <Button type="button" variant="outline" onClick={() => setReview(false)}>Corriger la saisie</Button>}<Button type="submit" disabled={busy || !minor || minor > remaining || !date}>{busy ? "Enregistrement…" : review ? attempted ? "Réessayer la même demande" : "Confirmer les espèces reçues" : "Vérifier l’encaissement"}</Button></div>
  </form>;
}
