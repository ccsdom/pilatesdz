"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUpRight, Check, Download, History, LayoutGrid, List, Loader2, Mail, MoreHorizontal, Phone, Plus, Search, SlidersHorizontal, UsersRound, WalletCards, X } from "lucide-react";
import type { ClientPage, ClientProfile } from "@/domain/models/client";
import { clientsCsv, duplicateEmailGroups, matchesDirectory, type DirectoryFilters } from "@/domain/models/client-directory";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import styles from "./client-directory.module.css";

const surface = "border border-[#e3dbce] bg-[#fffdf9] dark:border-white/10 dark:bg-[#191713]";
const muted = "text-[#847969] dark:text-[#b4a898]";
const control = "h-11 rounded-xl border border-[#ded4c3] bg-transparent px-3 text-sm dark:border-white/15";
const defaults: DirectoryFilters = { status: "all", contact: "all" };

export function ClientDirectory({ initial, initialQuery }: { initial: ClientPage; initialQuery: string }) {
  const [clients, setClients] = useState(initial.clients);
  const [next, setNext] = useState(initial.next);
  const [query, setQuery] = useState(initialQuery);
  const [applied, setApplied] = useState({ query: initialQuery, ...defaults });
  const [filters, setFilters] = useState<DirectoryFilters>(defaults);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<{ profiles: ClientProfile[]; status: "active" | "inactive" } | null>(null);
  const duplicates = duplicateEmailGroups(clients);
  const chosen = clients.filter(client => selected.has(client.id));
  const active = clients.filter(client => client.status === "active").length;
  const withPhone = clients.filter(client => client.phone).length;
  const allSelected = clients.length > 0 && clients.every(client => selected.has(client.id));

  async function load(more: boolean, reset = false) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setMessage("");
    const criteria = more ? applied : reset ? { query: "", ...defaults } : { query: query.trim(), ...filters };
    try {
      const params = new URLSearchParams({ q: criteria.query, status: criteria.status, contact: criteria.contact });
      if (more && next) params.set("after", next);
      const response = await fetch(`/api/crm/clientes?${params}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chargement impossible.");
      const page = data as ClientPage;
      setClients(previous => more ? [...new Map([...previous, ...page.clients].map(client => [client.id, client])).values()] : page.clients);
      setNext(page.next);
      if (!more) { setSelected(new Set()); setApplied(criteria); }
      if (reset) { setQuery(""); setFilters(defaults); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Connexion interrompue. Réessayez le chargement."); }
    finally { lock.current = false; setBusy(false); }
  }
  function search(event: FormEvent) { event.preventDefault(); void load(false); }
  function toggle(id: string) {
    setSelected(previous => { const updated = new Set(previous); if (updated.has(id)) updated.delete(id); else if (updated.size < 100) updated.add(id); return updated; });
  }
  function exportCsv(profiles: ClientProfile[]) {
    const url = URL.createObjectURL(new Blob([clientsCsv(profiles)], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "clientes-pilates.csv"; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(`${profiles.length} fiche(s) exportée(s).`);
  }
  async function changeStatus() {
    if (!confirmation || lock.current) return;
    lock.current = true; setBusy(true); setError(""); setMessage("");
    const successes: ClientProfile[] = [], failures: string[] = [];
    let uncertain = false;
    for (const client of confirmation.profiles) {
      try {
        const response = await fetch("/api/crm/clientes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", id: client.id, version: client.version, profile: { name: client.name, email: client.email, phone: client.phone, status: confirmation.status } }) });
        const data = await response.json();
        if (!response.ok) { failures.push(`${client.name} : ${data.error || "modification refusée"}`); continue; }
        successes.push(data.profile);
      } catch { uncertain = true; break; }
    }
    const updated = new Map(successes.map(client => [client.id, client]));
    setClients(previous => previous.map(client => updated.get(client.id) ?? client).filter(client => matchesDirectory(client, applied)));
    setSelected(new Set()); setConfirmation(null);
    setMessage(`${successes.length} fiche(s) mise(s) à jour.`);
    if (failures.length || uncertain) setError([failures.join(" · "), uncertain ? "Connexion interrompue : certaines modifications ne sont pas confirmées. Rechargez la liste avant de réessayer." : "Rechargez la liste avant de réessayer les fiches refusées."].join(" "));
    lock.current = false; setBusy(false);
  }
  function actions(client: ClientProfile) {
    return <DropdownMenu><DropdownMenuTrigger asChild><button type="button" disabled={busy} aria-label={`Actions pour ${client.name}`} className="rounded-lg p-2 hover:bg-[#b7893b]/10"><MoreHorizontal size={20} /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
      <DropdownMenuItem asChild><Link href={`/crm/clientes/${client.id}`}><ArrowUpRight />Ouvrir / modifier la fiche</Link></DropdownMenuItem>
      <DropdownMenuItem asChild><Link href={`/crm/clientes/${client.id}/forfaits`}><WalletCards />Forfaits et crédits</Link></DropdownMenuItem>
      <DropdownMenuItem asChild><Link href={`/crm/clientes/${client.id}/historique`}><History />Historique</Link></DropdownMenuItem>
      <DropdownMenuSeparator /><DropdownMenuItem onSelect={() => exportCsv([client])}><Download />Exporter la fiche</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => setConfirmation({ profiles: [client], status: client.status === "active" ? "inactive" : "active" })}>{client.status === "active" ? "Désactiver la fiche" : "Activer la fiche"}</DropdownMenuItem>
    </DropdownMenuContent></DropdownMenu>;
  }
  const checkbox = (client: ClientProfile) => <input type="checkbox" aria-label={`Sélectionner ${client.name}`} checked={selected.has(client.id)} disabled={busy || (!selected.has(client.id) && selected.size >= 100)} onChange={() => toggle(client.id)} className="h-4 w-4 cursor-pointer accent-[#a77b37]" />;
  const avatar = (client: ClientProfile) => <span aria-hidden="true" className={styles.avatar}>{client.name.split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase()}</span>;
  const badge = (client: ClientProfile) => <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${client.status === "active" ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300" : "bg-stone-500/10 text-stone-600 dark:text-stone-300"}`}><span className={`h-1.5 w-1.5 rounded-full ${client.status === "active" ? "bg-emerald-500" : "bg-stone-400"}`} />{client.status === "active" ? "Active" : "Inactive"}</span>;

  return <div className={styles.directory + " space-y-6"}>
    <header className={styles.hero}>
      <div><p className={styles.eyebrow}>PILATES DZ · Les clientes</p><h1>Chaque cliente,<br /><em>un parcours unique.</em></h1><p className={styles.intro}>Retrouvez vos clientes, accompagnez leur progression et gardez leurs informations à portée de main.</p></div>
      <Link href="/crm/clientes/nouvelle" className={styles.primary}><Plus size={18} aria-hidden="true" />Nouvelle cliente<ArrowUpRight size={16} aria-hidden="true" /></Link>
    </header>
    <section aria-label="Aperçu des fiches chargées" className={styles.stats}>
      {[{ label: "Fiches chargées", value: clients.length, detail: next ? "D’autres fiches sont disponibles" : "Dans les résultats actuels", icon: UsersRound }, { label: "Fiches actives", value: active, detail: "Parmi les fiches chargées", icon: Check }, { label: "Téléphone renseigné", value: withPhone, detail: "Parmi les fiches chargées", icon: Phone }].map(item => <div key={item.label} className="flex items-center justify-between p-5"><div><p className={`text-xs ${muted}`}>{item.label}</p><p className="my-1 font-serif text-3xl tabular-nums">{item.value.toLocaleString("fr-FR")}</p><p className={`text-[11px] ${muted}`}>{item.detail}</p></div><item.icon size={22} strokeWidth={1.3} className="text-[#b7893b]" /></div>)}
    </section>
    <section className={styles.toolbar} aria-label="Recherche et filtres">
      <form onSubmit={search} className="flex flex-wrap items-end gap-3">
        <div className={styles.search}><label htmlFor="directory-search" className={`mb-2 block text-xs ${muted}`}>Rechercher une cliente</label><div className="relative"><Search size={16} className={`absolute left-3 top-3.5 ${muted}`} /><input id="directory-search" value={query} onChange={event => setQuery(event.target.value)} maxLength={254} placeholder="Nom, e-mail, téléphone…" disabled={busy} className={`${control} w-full pl-9`} /></div></div>
        <div><label htmlFor="directory-status" className={`mb-2 block text-xs ${muted}`}>Statut de la fiche</label><select id="directory-status" value={filters.status} disabled={busy} onChange={event => setFilters(previous => ({ ...previous, status: event.target.value as DirectoryFilters["status"] }))} className={control}><option value="all">Tous les statuts</option><option value="active">Actives</option><option value="inactive">Inactives</option></select></div>
        <div><label htmlFor="directory-contact" className={`mb-2 block text-xs ${muted}`}>Coordonnées</label><select id="directory-contact" value={filters.contact} disabled={busy} onChange={event => setFilters(previous => ({ ...previous, contact: event.target.value as DirectoryFilters["contact"] }))} className={control}><option value="all">Toutes les fiches</option><option value="phone">Avec téléphone</option><option value="missing-phone">Sans téléphone</option></select></div>
        <Button type="submit" disabled={busy} className="h-11 rounded-xl"><SlidersHorizontal size={15} />Appliquer</Button>
      </form>
      <div className={`mt-3 flex flex-wrap items-center justify-between gap-2 text-xs ${muted}`}><p>Recherche par début de nom, prénom, e-mail ou numéro.</p>{(applied.query || applied.status !== "all" || applied.contact !== "all") && <button disabled={busy} onClick={() => void load(false, true)} className="inline-flex items-center gap-1 underline"><X size={12} />Réinitialiser les filtres appliqués</button>}</div>
    </section>
    {duplicates.length > 0 && <aside role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><h2 className="font-semibold">Dossiers à rapprocher</h2><p className="mt-1">Plusieurs fiches chargées partagent une adresse e-mail. Vérifiez leur identité avant toute attribution de forfait ou invitation. Aucun rapprochement automatique n’est effectué.</p><ul className="mt-2 space-y-2">{duplicates.map(group => <li key={group.email} className="break-words"><span>{group.email} : </span>{group.clients.map((client, index) => <span key={client.id}>{index > 0 && " · "}<Link className="underline" href={`/crm/clientes/${client.id}`}>{client.name}</Link></span>)}</li>)}</ul></aside>}
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className={styles.directoryTitle}>L’annuaire du studio <span className={`ml-2 font-normal ${muted}`}>{clients.length}{next ? "+" : ""}</span></h2><p className={`mt-1 text-xs ${muted}`}>Sélectionnez des fiches pour agir en une fois (100 maximum).</p></div><div className="flex items-center gap-2"><Button variant="outline" aria-label={chosen.length ? "Exporter la sélection" : "Exporter les fiches chargées"} disabled={busy || !clients.length} onClick={() => exportCsv(chosen.length ? chosen : clients)} className="rounded-xl"><Download size={15} /><span className="hidden sm:inline">Exporter {chosen.length ? "la sélection" : "les fiches chargées"}</span></Button><div className={styles.switcher} role="group" aria-label="Mode d’affichage"><button aria-label="Vue en grille" aria-pressed={view === "grid"} onClick={() => setView("grid")} className={`rounded-lg p-2 ${view === "grid" ? "bg-[#b7893b]/15 text-[#a77b37]" : muted}`}><LayoutGrid size={17} /></button><button aria-label="Vue en liste" aria-pressed={view === "list"} onClick={() => setView("list")} className={`rounded-lg p-2 ${view === "list" ? "bg-[#b7893b]/15 text-[#a77b37]" : muted}`}><List size={17} /></button></div></div></div>
    <div className="flex flex-wrap items-center gap-3 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={allSelected} disabled={busy || !clients.length} onChange={() => setSelected(allSelected ? new Set() : new Set(clients.slice(0, 100).map(client => client.id)))} className="h-4 w-4 accent-[#a77b37]" />Sélectionner les fiches chargées</label>{selected.size > 0 && <span className="text-[#a77b37]">{selected.size} sélectionnée(s)</span>}</div>
    {selected.size > 0 && <div className="sticky top-24 z-20 flex flex-wrap items-center gap-3 rounded-2xl bg-[#23211b] px-5 py-3 text-[#fff9ee] shadow-lg"><span className="mr-auto text-sm">{selected.size} fiche(s) sélectionnée(s)</span><button disabled={busy} onClick={() => setConfirmation({ profiles: chosen, status: "active" })} className="rounded-lg border border-white/20 px-3 py-2 text-xs">Activer</button><button disabled={busy} onClick={() => setConfirmation({ profiles: chosen, status: "inactive" })} className="rounded-lg border border-white/20 px-3 py-2 text-xs">Désactiver</button><button disabled={busy} onClick={() => exportCsv(chosen)} className="rounded-lg border border-white/20 px-3 py-2 text-xs">Exporter</button><button disabled={busy} aria-label="Annuler la sélection" onClick={() => setSelected(new Set())}><X size={17} /></button></div>}
    {error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800"><p>{error}</p><button disabled={busy} onClick={() => void load(false)} className="mt-2 underline">Recharger les résultats</button></div>}
    {message && <p role="status" className="text-sm text-[#946b2f] dark:text-[#dbb97e]">{message}</p>}
    {clients.length === 0 ? <div className={`rounded-2xl py-16 text-center ${surface}`}><UsersRound size={32} strokeWidth={1.2} className="mx-auto mb-4 text-[#b7893b]" /><h3 className="font-serif text-2xl">Aucune fiche à afficher</h3><p className={`mt-2 text-sm ${muted}`}>{next ? "Continuez le chargement pour rechercher d’autres correspondances." : "Modifiez vos filtres ou ajoutez votre première cliente."}</p></div> : view === "grid" ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Clientes en grille" aria-busy={busy}>
      {clients.map(client => <article key={client.id} className={`${styles.card} ${selected.has(client.id) ? "ring-2 ring-[#b7893b]/60" : ""}`}><div className="mb-5 flex items-center justify-between">{checkbox(client)}{badge(client)}{actions(client)}</div><div className="flex items-center gap-3">{avatar(client)}<div className="min-w-0"><Link href={`/crm/clientes/${client.id}`} className="break-words font-serif text-xl hover:underline">{client.name}</Link><p className={`mt-1 text-[11px] ${muted}`}>Cliente du studio</p></div></div><div className={`my-5 space-y-2.5 text-xs ${muted}`}><p className="flex items-center gap-2"><Mail size={14} className="shrink-0" /><span className="break-all">{client.email}</span></p><p className="flex items-center gap-2"><Phone size={14} className="shrink-0" />{client.phone || "Téléphone à compléter"}</p></div><div className="flex items-center justify-between border-t border-[#b7893b]/15 pt-4"><span className={`text-[10px] ${muted}`}>Depuis {new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric", timeZone: "Africa/Algiers" }).format(client.createdAt)}</span><Link href={`/crm/clientes/${client.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-[#946b2f] dark:text-[#dbb97e]">Voir la fiche<ArrowUpRight size={14} /></Link></div></article>)}
    </div> : <div className={styles.tableWrap} role="region" aria-label="Liste des clientes, défilement horizontal" tabIndex={0}><table className="w-full text-left text-sm" aria-label="Clientes en liste" aria-busy={busy}><thead className={`border-b border-[#b7893b]/15 text-[10px] uppercase tracking-wider ${muted}`}><tr><th scope="col" className="p-4"><span className="sr-only">Sélection</span></th><th scope="col" className="p-4">Cliente</th><th scope="col" className="p-4">Coordonnées</th><th scope="col" className="p-4">Statut</th><th scope="col" className="p-4"><span className="sr-only">Actions</span></th></tr></thead><tbody>{clients.map(client => <tr key={client.id} className={`border-b border-[#b7893b]/10 last:border-0 hover:bg-[#b7893b]/5 ${selected.has(client.id) ? "bg-[#b7893b]/10" : ""}`}><td className="p-4">{checkbox(client)}</td><td className="p-4"><div className="flex min-w-44 items-center gap-3">{avatar(client)}<Link href={`/crm/clientes/${client.id}`} className="font-medium hover:underline">{client.name}</Link></div></td><td className={`p-4 text-xs ${muted}`}><p>{client.email}</p><p className="mt-1.5">{client.phone || "Téléphone à compléter"}</p></td><td className="p-4">{badge(client)}</td><td className="p-4">{actions(client)}</td></tr>)}</tbody></table></div>}
    <footer className={`space-y-3 py-3 text-center text-xs ${muted}`}><p aria-live="polite">{clients.length} fiche(s) affichée(s){next ? " · Suite disponible" : " · Fin des résultats"}</p>{next && <Button variant="outline" disabled={busy} onClick={() => void load(true)} className="rounded-full px-8">{busy ? <Loader2 size={15} className="animate-spin" /> : <ArrowDown size={15} />}Charger plus</Button>}</footer>
    <Dialog open={!!confirmation} onOpenChange={open => { if (!open && !busy) setConfirmation(null); }}><DialogContent showCloseButton={!busy}><DialogHeader><DialogTitle>{confirmation?.status === "active" ? "Activer" : "Désactiver"} {confirmation?.profiles.length} fiche(s) ?</DialogTitle><DialogDescription>Cette action modifie le statut des fiches uniquement. Les accès de connexion, forfaits et réservations sont conservés.</DialogDescription></DialogHeader><p className="max-h-32 overflow-auto text-sm">{confirmation?.profiles.map(client => client.name).join(", ")}</p><DialogFooter><Button variant="outline" disabled={busy} onClick={() => setConfirmation(null)}>Annuler</Button><Button disabled={busy} onClick={() => void changeStatus()}>{busy ? "Enregistrement…" : "Confirmer la modification"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
