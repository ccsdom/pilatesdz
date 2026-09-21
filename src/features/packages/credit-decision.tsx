"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { CreditStatus } from "@/domain/models/credit-settlement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function CreditDecision({ id, clientId, name, credit, editable }: { id: string; clientId: string; name: string; credit: CreditStatus; editable: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const request = useRef<{ key: string; id: string } | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget);
    const payload = { id, clientId, version: credit.version, state: form.get("state"), reason: form.get("reason") };
    const key = JSON.stringify(payload);
    if (request.current?.key !== key) request.current = { key, id: crypto.randomUUID() };
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/crm/credits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, requestId: request.current.id, action: "decide" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Décision impossible.");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Décision non confirmée. Actualisez avant de réessayer."); }
    finally { setBusy(false); }
  }
  return <section className="w-full space-y-3 rounded-xl border border-[#b7893b]/25 bg-[#b7893b]/5 p-4"><h3 className="text-sm font-medium">Crédit de {name} : {credit.state === "reserved" ? "réservé, à valider" : credit.state === "consumed" ? "consommé" : "restitué"}</h3>{credit.legacy && <p className="text-xs text-muted-foreground">Ancienne réservation déjà déduite : aucune nouvelle déduction lors de la validation.</p>}{editable && <form onSubmit={submit} className="flex flex-wrap items-end gap-3"><div><label className="mb-2 block text-xs" htmlFor={`credit-state-${clientId}`}>Décision</label><select name="state" id={`credit-state-${clientId}`} defaultValue={credit.state === "consumed" ? "refunded" : "consumed"} disabled={busy} className="h-10 rounded-lg border bg-background px-3 text-sm"><option value="consumed">Séance consommée</option><option value="refunded">Restituer le crédit</option></select></div><div className="min-w-40 flex-1"><label className="mb-2 block text-xs" htmlFor={`credit-reason-${clientId}`}>Motif</label><Input name="reason" id={`credit-reason-${clientId}`} required minLength={5} maxLength={300} disabled={busy} placeholder="Présence validée, absence excusée…" /></div><Button type="submit" disabled={busy}>Valider la décision</Button></form>}{!editable && <p className="text-xs text-muted-foreground">Décision disponible après la fin du créneau.</p>}{error && <p role="alert" className="text-sm text-red-700">{error}</p>}</section>;
}
