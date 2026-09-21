"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
export function CreditSettings({ settings }: { settings: { mode: "manual" | "automatic"; version: number; automationReady: boolean } }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const mode = new FormData(event.currentTarget).get("mode");
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/crm/credits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "mode", mode, version: settings.version }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Réglage impossible.");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Modification non confirmée. Actualisez la page."); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4 rounded-2xl border border-[#b7893b]/25 p-5"><h2 className="font-serif text-2xl">Validation des séances</h2><p className="text-sm text-muted-foreground">Mode actuel : {settings.mode === "manual" ? "manuel" : "automatique"}. Le réglage s’applique aux nouvelles réservations uniquement.</p><form onSubmit={save} className="flex flex-wrap items-end gap-3"><label className="space-y-2 text-sm"><span className="block">Mode de validation</span><select key={settings.version} name="mode" defaultValue={settings.mode} disabled={busy} className="h-11 rounded-xl border bg-background px-3"><option value="manual">Manuelle — décision du manager</option><option value="automatic" disabled={!settings.automationReady}>Automatique — après le créneau</option></select></label><Button disabled={busy} type="submit">Enregistrer le mode</Button></form><p className="text-xs text-muted-foreground">En automatique, une réservation non annulée consomme le crédit à la fin du créneau, sans déclarer la cliente présente. Une correction motivée reste possible dans le planning.</p>{!settings.automationReady && <p className="text-xs text-amber-700">Le traitement automatique n’est pas encore actif ou n’a pas répondu récemment. La validation manuelle reste disponible.</p>}{error && <p role="alert" className="text-sm text-red-700">{error}</p>}</section>;
}
