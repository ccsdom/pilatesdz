"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { packageDates } from "@/domain/models/package";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PackageForm({ clientId, today, lastDay }: { clientId: string; today: string; lastDay: string }) {
  const router = useRouter();
  const requestId = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || success) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      requestId.current ??= crypto.randomUUID();
      const value = { label: form.get("label"), credits: Number(form.get("credits")), ...packageDates(String(form.get("first")), String(form.get("last"))) };
      const response = await fetch("/api/forfaits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: requestId.current, clientId, package: value }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Attribution impossible."); return; }
      setSuccess(true); router.refresh();
    } catch { setError("Attribution non confirmée. Vérifiez les dates ou réessayez avec les mêmes informations."); }
    finally { setBusy(false); }
  }
  if (success) return <section className="rounded-2xl border bg-white/70 p-6"><p role="status">Forfait attribué. Les crédits sont disponibles selon les dates choisies.</p><Button className="mt-4" onClick={() => { requestId.current = null; setSuccess(false); }}>Attribuer un autre forfait</Button></section>;
  return <form onSubmit={submit} className="space-y-5 rounded-2xl border border-[#ded4c3] bg-[#fffdf9] p-6"><h2 className="font-serif text-2xl">Attribuer un forfait</h2><div className="grid gap-5 sm:grid-cols-2">
    <div className="space-y-2"><Label htmlFor="pack-label">Nom du forfait</Label><Input id="pack-label" name="label" required maxLength={80} placeholder="Ex. Reformer 10 séances" disabled={busy} /></div>
    <div className="space-y-2"><Label htmlFor="pack-credits">Nombre de crédits</Label><Input id="pack-credits" name="credits" type="number" min={1} max={100} step={1} defaultValue={10} required disabled={busy} /></div>
    <div className="space-y-2"><Label htmlFor="pack-first">Premier jour de validité</Label><Input id="pack-first" name="first" type="date" defaultValue={today} required disabled={busy} /></div>
    <div className="space-y-2"><Label htmlFor="pack-last">Dernier jour de validité inclus</Label><Input id="pack-last" name="last" type="date" defaultValue={lastDay} required disabled={busy} /></div>
  </div><p className="text-sm leading-6 text-muted-foreground">Dates à l’heure d’Alger. Un crédit par réservation. Un crédit annulé avant le cours revient au forfait d’origine, sans prolonger sa validité. Cette attribution locale n’enregistre aucun paiement.</p>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button disabled={busy} type="submit">{busy ? "Attribution…" : "Attribuer le forfait"}</Button></form>;
}
