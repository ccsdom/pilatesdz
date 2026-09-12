"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ClientAccess } from "@/domain/ports/access-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccessManager({ members }: { members: ClientAccess[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  async function act(body: object) {
    if (busy) return false;
    setBusy(true); setError(""); setMessage(""); setLink("");
    try {
      const response = await fetch("/api/crm/acces", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Opération impossible."); router.refresh(); return false; }
      if (data.invitationUrl) { setLink(data.invitationUrl); setMessage("Le lien de test est prêt."); }
      else setMessage("L’accès à ce centre est désactivé.");
      setConfirm(null); router.refresh(); return true;
    } catch { setError("Service indisponible. Vérifiez la liste des accès avant de réessayer."); return false; }
    finally { setBusy(false); }
  }
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (await act({ action: "invite", name: data.get("name"), email: data.get("email") })) form.reset();
  }
  return <div className="space-y-8">
    <section className="rounded-2xl border bg-card p-6"><h2 className="mb-5 font-serif text-2xl">Inviter une cliente</h2>
      <form onSubmit={invite} className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="invite-name">Nom de la cliente</Label><Input id="invite-name" name="name" autoComplete="name" required maxLength={100} disabled={busy} /></div><div className="space-y-2"><Label htmlFor="invite-email">Adresse e-mail</Label><Input id="invite-email" name="email" type="email" autoComplete="email" required maxLength={254} disabled={busy} /></div><Button type="submit" disabled={busy} className="sm:col-span-2 sm:justify-self-start">{busy ? "Opération en cours…" : "Créer l’invitation"}</Button></form>
    </section>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {message && <div role="status" className="space-y-3 rounded-xl border border-[#d5ae65] p-5"><p>{message}</p>{link && <><a href={link} target="_blank" rel="noreferrer" className="block underline">Ouvrir le lien de test</a><Label htmlFor="invitation-link">Lien local à copier</Label><Input id="invitation-link" readOnly value={link} onFocus={(event) => event.target.select()} /><p className="text-sm text-muted-foreground">Ce lien donne accès au choix du mot de passe. Il n’est affiché que pour cette démonstration.</p></>}</div>}
    <section className="space-y-4"><h2 className="font-serif text-2xl">Accès des clientes</h2>{members.length === 0 && <p className="text-muted-foreground">Aucun accès cliente sur cette page.</p>}
      {members.map((member) => <article key={member.uid} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5"><div className="min-w-0"><h3 className="break-words font-medium">{member.name}</h3><p className="break-all text-sm text-muted-foreground">{member.email || "Compte de démonstration"}</p><p className="mt-2 text-sm">{member.active ? "Accès autorisé" : "Accès désactivé"}</p>{member.clientId && <Link href={`/crm/clientes/${member.clientId}`} className="mt-2 block text-sm underline">Ouvrir la fiche cliente</Link>}</div>
        {member.active && <div className="flex flex-wrap gap-3">{confirm === member.uid ? <div className="space-y-3"><p className="text-sm">Désactiver l’accès de {member.name} à ce centre ?</p><div className="flex flex-wrap gap-3"><Button variant="destructive" disabled={busy} onClick={() => act({ action: "deactivate", uid: member.uid })}>Confirmer la désactivation</Button><Button variant="outline" disabled={busy} onClick={() => setConfirm(null)}>Annuler</Button></div></div> : <>{member.email && <Button variant="outline" disabled={busy} onClick={() => act({ action: "invitation", uid: member.uid })}>Nouveau lien de test</Button>}<Button variant="outline" disabled={busy} onClick={() => { setLink(""); setMessage(""); setConfirm(member.uid); }}>Désactiver</Button></>}</div>}
      </article>)}
    </section>
  </div>;
}
