"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ClientAccess } from "@/domain/ports/access-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowUpRight, CheckCircle2, KeyRound, Loader2, LockKeyhole, Mail, Search, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import styles from "./access-manager.module.css";

export function AccessManager({ members }: { members: ClientAccess[] }) {
  const cloud = process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === "false";
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [confirm, setConfirm] = useState<string | null>(null);
  async function act(body: object) {
    if (busy) return false;
    setBusy(true); setError(""); setMessage(""); setLink("");
    try {
      const response = await fetch("/api/crm/acces", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Opération impossible."); router.refresh(); return false; }
      if (data.emailAccepted) setMessage("Demande d’envoi acceptée par Firebase. La personne invitée doit consulter sa boîte e-mail et ses courriers indésirables.");
      else if (!cloud && data.invitationUrl) { setLink(data.invitationUrl); setMessage("Le lien de test est prêt."); }
      else setMessage(data.active === true ? "L’accès à ce centre est réactivé." : "L’accès à ce centre est désactivé.");
      setConfirm(null); router.refresh(); return true;
    } catch { setError("Service indisponible. Vérifiez la liste des accès avant de réessayer."); return false; }
    finally { setBusy(false); }
  }
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (await act({ action: data.get("role") === "manager" ? "invite-manager" : "invite", name: data.get("name"), email: data.get("email") })) form.reset();
  }
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const visible = members.filter(member => (filter === "all" || member.active === (filter === "active")) && normalize(`${member.name} ${member.email}`).includes(normalize(search.trim())));
  const activeCount = members.filter(member => member.active).length;
  const target = members.find(member => member.uid === confirm);
  const surface = "rounded-2xl border border-[#e3dbce] bg-[#fffdf9] dark:border-white/10 dark:bg-[#191713]";
  const muted = "text-[#847969] dark:text-[#b4a898]";
  return <div className={styles.manager + " space-y-6"}>
    <section aria-label="Aperçu des accès sur cette page" className={styles.stats}>
      {[{ icon: UsersRound, label: "Accès du centre", value: members.length }, { icon: ShieldCheck, label: "Autorisés", value: activeCount }, { icon: LockKeyhole, label: "Désactivés", value: members.length - activeCount }].map(item => <article key={item.label} className={`${surface} flex items-center justify-between p-5`}><div><p className={`text-xs ${muted}`}>{item.label}</p><p className="mt-2 font-serif text-3xl tabular-nums">{item.value}</p><p className={`mt-1 text-[10px] ${muted}`}>Sur cette page</p></div><item.icon size={24} strokeWidth={1.3} className="text-[#a77b37]" /></article>)}
    </section>
    {error && <p role="alert" className="rounded-xl border border-red-300/40 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-300">{error}</p>}
    {message && <div role="status" className="space-y-3 rounded-xl border border-[#b7893b]/30 bg-[#b7893b]/5 p-5"><p className="flex items-start gap-2 text-sm"><CheckCircle2 size={18} className="shrink-0 text-[#a77b37]" />{message}</p>{link && <><a href={link} target="_blank" rel="noreferrer" className="block text-sm underline">Ouvrir le lien de test</a><Label htmlFor="invitation-link">Lien local à copier</Label><Input id="invitation-link" readOnly value={link} onFocus={(event) => event.target.select()} /><p className={`text-xs ${muted}`}>Ce lien donne accès au choix du mot de passe. Il n’est affiché que pour cette démonstration.</p></>}</div>}
    <div className={styles.layout}>
      <section className={styles.directory} aria-label="Clientes et managers">
        <div className="space-y-4 border-b border-[#b7893b]/15 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-serif text-2xl">Clientes et managers</h2><span className={`rounded-full bg-[#b7893b]/10 px-2.5 py-1 text-xs ${muted}`}>{visible.length} affiché(s)</span></div>
          <div className="flex flex-wrap gap-2"><div className="relative min-w-40 flex-1"><label htmlFor="access-search" className="sr-only">Rechercher parmi les accès de cette page</label><Search size={15} className={`absolute left-3 top-3.5 ${muted}`} /><Input id="access-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Nom ou adresse e-mail…" className="h-11 rounded-xl pl-9" /></div><label htmlFor="access-status" className="sr-only">Filtrer par statut</label><select id="access-status" value={filter} onChange={event => setFilter(event.target.value)} className="h-11 rounded-xl border border-input bg-transparent px-3 text-xs"><option value="all">Tous les statuts</option><option value="active">Autorisés</option><option value="inactive">Désactivés</option></select></div><p className={`text-[11px] ${muted}`}>Recherche et filtres sur les accès de cette page.</p>
        </div>
        {visible.length === 0 && <div className="px-5 py-14 text-center"><KeyRound className="mx-auto mb-3 text-[#b7893b]" size={28} strokeWidth={1.3} /><h3 className="font-serif text-xl">{members.length ? "Aucun accès ne correspond" : "Aucun accès sur cette page"}</h3><p className={`mx-auto mt-2 max-w-xs text-xs leading-5 ${muted}`}>{members.length ? "Modifiez la recherche ou le statut sélectionné." : "Invitez une cliente ou un manager pour ouvrir son accès."}</p>{(search || filter !== "all") && <button onClick={() => { setSearch(""); setFilter("all"); }} className="mt-4 text-xs text-[#957035] underline dark:text-[#dbb97e]">Effacer les filtres</button>}</div>}
        <div className={styles.members + " divide-y divide-[#b7893b]/10"}>{visible.map(member => <article key={member.uid} className="p-5 transition hover:bg-[#b7893b]/[0.03]">
          <div className="flex items-start gap-3"><span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#b7893b]/15 bg-[#b7893b]/10 font-serif text-lg text-[#946b2f] dark:text-[#dbb97e]">{member.name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase()}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="break-words text-sm font-semibold">{member.name}</h3><span className={styles.role} data-role={member.role}>{member.role === "manager" ? "Manager" : "Cliente"}</span><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${member.active ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300" : "bg-stone-500/10 text-stone-600 dark:text-stone-300"}`}><span className={`h-1.5 w-1.5 rounded-full ${member.active ? "bg-emerald-500" : "bg-stone-400"}`} />{member.active ? "Accès autorisé" : "Accès désactivé"}</span></div><p className={`mt-1.5 break-all text-xs ${muted}`}>{member.email || "Adresse e-mail non renseignée"}</p></div></div>
          <div className="mt-4 flex flex-wrap items-center gap-2 sm:pl-14">{member.clientId && <Link href={`/crm/clientes/${member.clientId}`} className="mr-auto inline-flex items-center gap-1 py-2 text-xs font-medium text-[#946b2f] hover:underline dark:text-[#dbb97e]">Fiche cliente<ArrowUpRight size={13} /></Link>}{member.active && <>{member.email && <Button variant="outline" size="sm" disabled={busy} onClick={() => act({ action: "invitation", uid: member.uid })} className="h-auto min-h-9 whitespace-normal rounded-lg text-xs"><Mail size={13} />{cloud ? "Renvoyer l’e-mail d’accès" : "Nouveau lien de test"}</Button>}<Button variant="ghost" size="sm" disabled={busy} onClick={() => { setLink(""); setMessage(""); setError(""); setConfirm(member.uid); }} className="rounded-lg text-xs text-[#827663] dark:text-[#b4a898]"><LockKeyhole size={13} />Désactiver</Button></>}{!member.active && <Button variant="outline" size="sm" disabled={busy} onClick={() => { setError(""); setConfirm(member.uid); }}>Réactiver</Button>}</div>
        </article>)}</div>
      </section>
      <aside className={styles.aside + " space-y-4"}>
        <section className={styles.invitation}><div className="border-b border-[#b7893b]/15 bg-[#b7893b]/5 p-5"><span className="mb-4 inline-flex rounded-xl bg-[#b7893b]/10 p-2.5 text-[#a77b37]"><UserPlus size={21} strokeWidth={1.5} /></span><h2 className="font-serif text-2xl">Inviter une personne</h2><p className={`mt-2 text-xs leading-5 ${muted}`}>Cliente : espace personnel. Manager : gestion opérationnelle complète, sans gestion des accès.</p></div>
          <form onSubmit={invite} className="space-y-4 p-5"><div className="space-y-2"><Label htmlFor="invite-role">Type d’accès</Label><select id="invite-role" name="role" disabled={busy} className="h-11 w-full rounded-xl border bg-background px-3"><option value="client">Cliente</option><option value="manager">Manager</option></select></div><div className="space-y-2"><Label htmlFor="invite-name" className="text-xs">Nom de la personne</Label><Input id="invite-name" name="name" autoComplete="name" placeholder="Prénom et nom" required maxLength={100} disabled={busy} className="h-11 rounded-xl" /></div><div className="space-y-2"><Label htmlFor="invite-email" className="text-xs">Adresse e-mail</Label><Input id="invite-email" name="email" type="email" autoComplete="email" placeholder="prenom@exemple.com" required maxLength={254} disabled={busy} className="h-11 rounded-xl" /></div><Button type="submit" disabled={busy} className="h-auto min-h-11 w-full whitespace-normal rounded-xl text-xs">{busy ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}{busy ? "Opération en cours…" : cloud ? "Créer et envoyer l’e-mail d’accès" : "Créer l’invitation"}</Button><p className={`text-[11px] leading-5 ${muted}`}>{cloud ? "La personne invitée choisit son mot de passe depuis l’e-mail reçu." : "Mode local : un lien de test sera proposé, sans envoi d’e-mail."}</p></form>
        </section>
        <div className="rounded-2xl border border-[#b7893b]/20 bg-[#b7893b]/5 p-5"><h3 className="flex items-center gap-2 text-xs font-semibold"><ShieldCheck size={16} className="text-[#a77b37]" />Des accès maîtrisés</h3><p className={`mt-3 text-xs leading-6 ${muted}`}>Désactiver un accès bloque la connexion au centre. La fiche cliente, les réservations et les forfaits sont conservés.</p><Link href="/crm/clientes" className="mt-3 inline-flex items-center gap-1 text-xs text-[#946b2f] hover:underline dark:text-[#dbb97e]">Consulter l’annuaire<ArrowUpRight size={13} /></Link></div>
      </aside>
    </div>
    <Dialog open={!!confirm} onOpenChange={open => { if (!open && !busy) setConfirm(null); }}><DialogContent showCloseButton={!busy}><DialogHeader><DialogTitle>{target?.active ? "Désactiver cet accès ?" : "Réactiver cet accès ?"}</DialogTitle><DialogDescription>{target?.name} {target?.active ? "ne pourra plus accéder à ce centre. Ses données seront conservées." : "pourra de nouveau accéder au centre avec son rôle actuel."}</DialogDescription></DialogHeader>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<DialogFooter><Button variant="outline" disabled={busy} onClick={() => setConfirm(null)}>Annuler</Button><Button variant={target?.active ? "destructive" : "default"} disabled={busy || !target} onClick={() => target && act({ action: target.active ? "deactivate" : "reactivate", uid: target.uid })}>{busy ? "Enregistrement…" : target?.active ? "Confirmer la désactivation" : "Confirmer la réactivation"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
