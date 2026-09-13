"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatCashAmount, type PaymentRecord } from "@/domain/models/payment";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function PaymentCorrectionForm({ clientId, subscriptionId, payment }: {
  clientId: string; subscriptionId: string; payment: PaymentRecord;
}) {
  const router = useRouter();
  const requestId = useRef<string | null>(null);
  const [reason, setReason] = useState("");
  const [review, setReview] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy || done || reason.trim().length < 5) return;
    if (!review) { setReview(true); return; }
    setBusy(true); setAttempted(true); setError("");
    requestId.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/encaissements/corrections", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, subscriptionId, requestId: requestId.current, correction: { paymentId: payment.id, reason } }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Correction non confirmée."); return; }
      setDone(true); router.refresh();
    } catch { setError("Correction non confirmée. Réessayez la même demande ou rechargez le journal pour vérifier son état."); }
    finally { setBusy(false); }
  }
  if (done) return <p role="status">Saisie annulée. La correction est conservée dans le journal et le solde est actualisé.</p>;
  return <details className="rounded-lg border border-[#ded4c3] p-3">
    <summary className="cursor-pointer text-sm underline">Corriger une erreur de saisie</summary>
    <form onSubmit={submit} className="mt-4 space-y-3">
      <p className="text-sm">L’annulation retire la totalité de cette saisie du cumul : {formatCashAmount(payment.amountMinor)} reçus le {payment.receivedDate}. L’écriture restera visible. Aucun remboursement d’espèces n’est enregistré.</p>
      <Label htmlFor={`correction-${payment.id}`}>Motif de la correction</Label>
      <textarea id={`correction-${payment.id}`} className="min-h-24 w-full rounded-md border p-3" minLength={5} maxLength={300} required value={reason} disabled={review || attempted} onChange={event => setReason(event.target.value)} />
      {review && <p className="rounded-lg bg-[#f7efe4] p-3 text-sm">Confirmer l’annulation de {formatCashAmount(payment.amountMinor)} pour le motif : « {reason.trim()} » ? Le solde restant à enregistrer augmentera de ce montant. Pour rectifier un montant, saisissez ensuite un nouvel encaissement exact.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-3">{review && !attempted && <Button type="button" variant="outline" onClick={() => setReview(false)}>Revenir au motif</Button>}<Button type="submit" variant="outline" disabled={busy || reason.trim().length < 5}>{busy ? "Correction…" : review ? attempted ? "Réessayer la même correction" : "Confirmer l’annulation de la saisie" : "Vérifier la correction"}</Button></div>
    </form>
  </details>;
}
