"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { parseStudioDateTime } from "@/domain/models/planning";
import { COURSE_DURATION_MINUTES, COURSE_MAX_CAPACITY } from "@/domain/models/studio-offers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SessionForm({ defaultDateTime }: { defaultDateTime: string }) {
  const router = useRouter();
  const requestId = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      requestId.current ??= crypto.randomUUID();
      const session = { title: form.get("title"), instructor: form.get("instructor"), startsAt: parseStudioDateTime(String(form.get("startsAt"))), durationMinutes: Number(form.get("duration")), capacity: Number(form.get("capacity")) };
      const response = await fetch("/api/planning", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", requestId: requestId.current, session }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Création impossible."); return; }
      router.push(`/crm/planning/${result.session.id}`); router.refresh();
    } catch { setError("Création non confirmée. Vérifiez la date ou réessayez avec les mêmes informations."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-6 rounded-2xl border border-[#ded4c3] bg-[#fffdf9] p-5 sm:p-7"><h2 className="font-serif text-2xl">Informations de la séance</h2><div className="grid gap-5 sm:grid-cols-2">
    <div className="space-y-2"><Label htmlFor="session-title">Nom du cours</Label><Input id="session-title" name="title" required maxLength={80} placeholder="Ex. Reformer Fondations" disabled={busy} /></div>
    <div className="space-y-2"><Label htmlFor="session-instructor">Coach</Label><Input id="session-instructor" name="instructor" required maxLength={80} disabled={busy} /></div>
    <div className="space-y-2"><Label htmlFor="session-start">Date et heure à Alger</Label><Input id="session-start" name="startsAt" type="datetime-local" defaultValue={defaultDateTime} required disabled={busy} /></div>
    <div className="space-y-2"><Label htmlFor="session-duration">Durée en minutes</Label><Input id="session-duration" name="duration" type="number" value={COURSE_DURATION_MINUTES} readOnly required disabled={busy} /></div>
    <div className="space-y-2"><Label htmlFor="session-capacity">Nombre de places (4 maximum)</Label><Input id="session-capacity" name="capacity" type="number" min={1} max={COURSE_MAX_CAPACITY} step={1} defaultValue={COURSE_MAX_CAPACITY} required disabled={busy} /></div>
  </div><p className="text-sm leading-6 text-muted-foreground">Cette séance sera visible dans le planning des clientes. Un crédit de forfait sera consommé à chaque nouvelle réservation. Aucun paiement ne sera enregistré.</p>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex flex-wrap items-center gap-5"><Button type="submit" disabled={busy}>{busy ? "Création…" : "Créer la séance"}</Button><Link href="/crm/planning" className="text-sm underline">Retour au planning</Link></div></form>;
}
