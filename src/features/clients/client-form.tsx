"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ClientProfile } from "@/domain/models/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, LockKeyhole, Save, UserRound } from "lucide-react";

export function ClientForm({ profile }: { profile?: ClientProfile }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [version, setVersion] = useState(profile?.version ?? 1);
  const [conflict, setConflict] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true); setError(""); setSaved(false); setConflict(false);
    try {
      const input = { name: data.get("name"), email: data.get("email"), phone: data.get("phone"), status: data.get("status") };
      const response = await fetch("/api/crm/clientes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile ? { action: "update", id: profile.id, version, profile: input } : { action: "create", profile: input }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Enregistrement impossible."); setConflict(response.status === 409 && !!profile); return; }
      if (!profile) router.push(`/crm/clientes/${result.profile.id}`);
      else { setVersion(result.profile.version); setSaved(true); }
      router.refresh();
    } catch { setError("Enregistrement non confirmé. Rechargez la fiche ou consultez la liste avant de réessayer."); setConflict(!!profile); }
    finally { setBusy(false); }
  }
  const emailLocked = !!(profile?.authUid || profile?.invitationUid);
  return <form onSubmit={submit} className="space-y-6 rounded-2xl border border-[#e3dbce] bg-[#fffdf9] p-5 sm:p-7 dark:border-white/10 dark:bg-[#191713] [&_input]:h-11 [&_input]:rounded-xl [&_input]:bg-[#f8f5ef] dark:[&_input]:bg-white/5 [&_label]:text-xs">
    <div className="flex items-start gap-3 border-b border-[#b7893b]/15 pb-5"><span className="rounded-xl bg-[#b7893b]/10 p-2.5 text-[#a77b37]"><UserRound size={19} strokeWidth={1.5} /></span><div><h2 className="font-serif text-2xl">Informations personnelles</h2><p className="mt-1 text-xs leading-5 text-[#847969] dark:text-[#b4a898]">Les coordonnées de référence pour accompagner cette cliente.</p></div></div>
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="client-name">Nom complet</Label><Input id="client-name" name="name" autoComplete="name" defaultValue={profile?.name} required maxLength={100} disabled={busy} /></div>
      <div className="space-y-2"><Label htmlFor="client-phone">Téléphone (facultatif)</Label><Input id="client-phone" name="phone" type="tel" autoComplete="tel" defaultValue={profile?.phone} maxLength={30} disabled={busy} placeholder="Ex. 0550 12 34 56" /></div>
      <div className="space-y-2 sm:col-span-2"><Label htmlFor="client-email">Adresse e-mail {emailLocked && <LockKeyhole size={12} aria-label="Adresse liée au compte" />}</Label><Input id="client-email" name="email" type="email" autoComplete="email" defaultValue={profile?.email} readOnly={emailLocked} required maxLength={254} disabled={busy} />{emailLocked && <p className="text-xs leading-5 text-[#847969] dark:text-[#b4a898]">L’adresse est liée à l’accès de connexion. Son changement nécessite un parcours de vérification distinct.</p>}</div>
      <div className="space-y-3 rounded-xl border border-[#b7893b]/15 bg-[#b7893b]/5 p-4 sm:col-span-2"><Label htmlFor="client-status">Suivi de la fiche</Label><select id="client-status" name="status" defaultValue={profile?.status ?? "active"} disabled={busy} className="h-11 w-full rounded-xl border border-input bg-[#fffdf9] px-3 text-sm dark:bg-[#211e19]"><option value="active">Fiche active</option><option value="inactive">Fiche inactive</option></select><p className="text-xs leading-5 text-[#847969] dark:text-[#b4a898]">Ce statut organise votre annuaire. Il ne modifie pas les accès de connexion, les forfaits ou les réservations.</p></div>
    </div>
    {error && <div role="alert" className="space-y-3 text-sm text-destructive"><p>{error}</p>{conflict && <Button type="button" variant="outline" onClick={() => window.location.reload()}>Recharger la fiche (abandonne la saisie)</Button>}</div>}
    {saved && <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300"><CheckCircle2 size={16} />Modifications enregistrées.</p>}
    <div className="flex flex-wrap items-center gap-4 border-t border-[#b7893b]/15 pt-5"><Button type="submit" disabled={busy} className="h-11 rounded-xl px-5">{busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{busy ? "Enregistrement…" : profile ? "Enregistrer les modifications" : "Créer la fiche cliente"}</Button><Link href="/crm/clientes" className="text-xs text-[#847969] underline underline-offset-4 dark:text-[#b4a898]">Retour à l’annuaire</Link></div>
  </form>;
}
