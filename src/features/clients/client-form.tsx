"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ClientProfile } from "@/domain/models/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  return <form onSubmit={submit} className="space-y-6 rounded-2xl border border-[#ded4c3] bg-[#fffdf9] p-5 sm:p-7">
    <h2 className="font-serif text-2xl">Coordonnées de la cliente</h2>
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="client-name">Nom complet</Label><Input id="client-name" name="name" autoComplete="name" defaultValue={profile?.name} required maxLength={100} disabled={busy} /></div>
      <div className="space-y-2"><Label htmlFor="client-phone">Téléphone (facultatif)</Label><Input id="client-phone" name="phone" type="tel" autoComplete="tel" defaultValue={profile?.phone} maxLength={30} disabled={busy} placeholder="Ex. 0550 12 34 56" /></div>
      <div className="space-y-2"><Label htmlFor="client-email">Adresse e-mail</Label><Input id="client-email" name="email" type="email" autoComplete="email" defaultValue={profile?.email} readOnly={emailLocked} required maxLength={254} disabled={busy} />{emailLocked && <p className="text-xs leading-5 text-muted-foreground">L’adresse est liée à l’accès de connexion. Son changement nécessite un parcours de vérification distinct.</p>}</div>
      <div className="space-y-2"><Label htmlFor="client-status">Statut de la fiche</Label><select id="client-status" name="status" defaultValue={profile?.status ?? "active"} disabled={busy} className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm"><option value="active">Active</option><option value="inactive">Inactive</option></select><p className="text-xs leading-5 text-muted-foreground">Ce statut organise le suivi des clientes. La connexion se gère séparément dans « Gestion des accès ».</p></div>
    </div>
    {error && <div role="alert" className="space-y-3 text-sm text-destructive"><p>{error}</p>{conflict && <Button type="button" variant="outline" onClick={() => window.location.reload()}>Recharger la fiche (abandonne la saisie)</Button>}</div>}
    {saved && <p role="status" className="text-sm text-[#765522]">Modifications enregistrées.</p>}
    <div className="flex flex-wrap items-center gap-5"><Button type="submit" disabled={busy}>{busy ? "Enregistrement…" : profile ? "Enregistrer les modifications" : "Créer la fiche cliente"}</Button><Link href="/crm/clientes" className="text-sm underline">Retour à la liste</Link></div>
  </form>;
}
