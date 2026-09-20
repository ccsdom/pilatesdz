"use client";

import { useRef, useState, type FormEvent } from "react";
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDown, Loader2, Pencil, Plus, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { measurementEvolution, measurementFields, type Measurement, type MeasurementKey, type MeasurementPage } from "@/domain/models/measurements";
import { studioDay } from "@/domain/models/planning";

const surface = "rounded-2xl border border-[#e3dbce] bg-[#fffdf9] p-5 dark:border-white/10 dark:bg-[#191713]";
const muted = "text-[#847969] dark:text-[#b4a898]";
const displayDay = (day: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
const number = (value: number) => value.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

export function MeasurementsPanel({ clientId, initial }: { clientId: string; initial: MeasurementPage }) {
  const [records, setRecords] = useState(initial.measurements);
  const [next, setNext] = useState(initial.next);
  const [metric, setMetric] = useState<MeasurementKey>("weight");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Measurement | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [notice, setNotice] = useState("");
  const evolution = measurementEvolution(records, metric);
  const field = measurementFields.find(f => f.key === metric)!;
  const latest = evolution.points.at(-1);
  function start(record: Measurement | null) { setEditing(record); setFormError(""); setConflict(false); setOpen(true); }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current) return;
    lock.current = true; setBusy(true); setFormError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    const values: Partial<Record<MeasurementKey, number>> = {};
    for (const field of measurementFields) { const value = String(form.get(field.key) ?? "").trim(); if (value) values[field.key] = Number(value.replace(",", ".")); }
    try {
      const response = await fetch("/api/crm/mensurations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId, version: editing?.version ?? 0, measurement: { day: editing?.day ?? form.get("day"), values } }) });
      const result = await response.json();
      if (!response.ok) { setConflict(response.status === 409); throw new Error(result.error || "Enregistrement impossible."); }
      const record = result.measurement as Measurement;
      setRecords(previous => [...previous.filter(item => item.day !== record.day), record].sort((a, b) => b.day.localeCompare(a.day)));
      setOpen(false); setNotice("Relevé enregistré.");
    } catch (cause) {
      if (cause instanceof TypeError) { setConflict(true); setFormError("Enregistrement non confirmé. Rechargez avant de réessayer."); }
      else setFormError(cause instanceof Error ? cause.message : "Enregistrement non confirmé. Rechargez avant de réessayer.");
    } finally { lock.current = false; setBusy(false); }
  }
  async function more() {
    if (!next || lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/crm/mensurations?${new URLSearchParams({ clientId, after: next })}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Chargement impossible.");
      const page = result as MeasurementPage;
      setRecords(previous => [...new Map([...page.measurements, ...previous].map(item => [item.day, item])).values()].sort((a, b) => b.day.localeCompare(a.day)));
      setNext(page.next);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Chargement impossible."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className={`max-w-xl text-sm leading-6 ${muted}`}>Un repère daté pour suivre l’évolution. Relevez les mesures dans des conditions comparables et du même côté pour le bras et la cuisse.</p><Button disabled={busy} onClick={() => start(null)} className="h-11 rounded-xl"><Plus size={16} />Nouveau relevé</Button></div>
    {notice && <p role="status" className="text-sm text-[#957035] dark:text-[#dbb97e]">{notice}</p>}
    <section className={surface} aria-label="Évolution des mensurations">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-serif text-2xl">L’évolution en un regard</h2><p className={`mt-1 text-xs ${muted}`}>Calculée sur les {records.length} relevés chargés{next ? " · historique partiel" : ""}.</p></div><div><label htmlFor="measurement-metric" className="sr-only">Mensuration affichée</label><select id="measurement-metric" value={metric} onChange={event => setMetric(event.target.value as MeasurementKey)} className="h-11 rounded-xl border border-[#b7893b]/25 bg-transparent px-3 text-sm">{measurementFields.map(field => <option key={field.key} value={field.key}>{field.label} ({field.unit})</option>)}</select></div></div>
      <div className="my-6 grid gap-4 sm:grid-cols-3"><div><p className={`text-xs ${muted}`}>Dernière valeur renseignée</p><p className="mt-2 font-serif text-3xl">{evolution.latest === undefined ? "—" : number(evolution.latest)} <span className={`text-sm ${muted}`}>{field.unit}</span></p></div><div><p className={`text-xs ${muted}`}>Écart depuis la première valeur chargée</p><p className="mt-2 font-serif text-3xl">{evolution.delta === null ? "—" : `${evolution.delta > 0 ? "+" : ""}${number(evolution.delta)}`} <span className={`text-sm ${muted}`}>{field.unit}</span></p></div><div><p className={`text-xs ${muted}`}>Date du dernier relevé pour cette mesure</p><p className="mt-3 text-sm">{latest ? displayDay(latest.day) : "Aucune valeur renseignée"}</p></div></div>
      {evolution.points.length >= 2 ? <div className="h-64 w-full" role="img" aria-label={`Évolution de ${field.label}, ${evolution.points.length} valeurs. Les valeurs détaillées sont dans le tableau ci-dessous.`}><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 640, height: 256 }}><LineChart data={evolution.points.map(record => ({ day: Date.parse(`${record.day}T12:00:00Z`), value: record.values[metric] }))} margin={{ top: 15, right: 20, bottom: 5, left: 0 }}><CartesianGrid stroke="#b7893b" strokeOpacity={0.12} vertical={false} /><XAxis dataKey="day" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={day => displayDay(new Date(Number(day)).toISOString().slice(0, 10))} tick={{ fontSize: 10, fill: "#94846e" }} minTickGap={35} /><YAxis tick={{ fontSize: 11, fill: "#94846e" }} width={45} domain={["auto", "auto"]} /><Tooltip labelFormatter={day => displayDay(new Date(Number(day)).toISOString().slice(0, 10))} formatter={value => [`${number(Number(value))} ${field.unit}`, field.label]} contentStyle={{ borderRadius: 12, background: "#fffdf9", color: "#29251e", border: "1px solid #e3dbce" }} /><Line type="linear" dataKey="value" stroke="#b7893b" strokeWidth={2} dot={{ r: 4, fill: "#b7893b" }} isAnimationActive={false} /></LineChart></ResponsiveContainer></div> : <div className={`rounded-xl border border-dashed border-[#b7893b]/25 py-10 text-center text-sm ${muted}`}><Ruler className="mx-auto mb-3 text-[#b7893b]" size={26} />{records.length ? "Ajoutez deux relevés contenant cette mesure pour afficher son évolution." : "Ajoutez un premier relevé pour commencer le suivi."}</div>}
    </section>
    <section className={surface}><h2 className="mb-4 font-serif text-2xl">Historique des relevés</h2><div className="overflow-x-auto"><table className="w-full text-left text-xs"><caption className={`sr-only ${muted}`}>Mensurations par date. Un tiret indique une valeur non renseignée.</caption><thead className={`border-b border-[#b7893b]/20 ${muted}`}><tr><th className="whitespace-nowrap px-3 py-3">Date</th>{measurementFields.map(field => <th key={field.key} className="whitespace-nowrap px-3 py-3">{field.label}<span className="block font-normal">{field.unit}</span></th>)}<th className="px-3 py-3"><span className="sr-only">Actions</span></th></tr></thead><tbody>{records.map(record => <tr key={record.day} className="border-b border-[#b7893b]/10 last:border-0"><th scope="row" className="whitespace-nowrap px-3 py-4 font-medium">{displayDay(record.day)}{record.version > 1 && <span className={`mt-1 block text-[10px] font-normal ${muted}`}>Corrigé · v{record.version}</span>}</th>{measurementFields.map(field => <td key={field.key} className="px-3 py-4 tabular-nums">{record.values[field.key] === undefined ? "—" : number(record.values[field.key]!)}</td>)}<td className="px-3 py-4"><button disabled={busy} aria-label={`Corriger le relevé du ${displayDay(record.day)}`} onClick={() => start(record)} className="inline-flex items-center gap-1 text-[#957035] dark:text-[#dbb97e]"><Pencil size={13} />Corriger</button></td></tr>)}</tbody></table></div>{!records.length && <p className={`py-6 text-center text-sm ${muted}`}>Aucun relevé enregistré.</p>}{error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}{next && <div className="mt-5 text-center"><Button variant="outline" disabled={busy} onClick={() => void more()}>{busy ? <Loader2 size={15} className="animate-spin" /> : <ArrowDown size={15} />}Charger les relevés précédents</Button></div>}</section>
    <p className={`text-xs ${muted}`}>Données privées · Consultation et saisie réservées à l’administration du centre.</p>
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}><DialogContent showCloseButton={!busy} className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing ? "Corriger le relevé" : "Nouveau relevé"}</DialogTitle><DialogDescription>Les champs sont facultatifs ; renseignez au moins une mesure. Utilisez une décimale maximum. Un seul relevé par date.</DialogDescription></DialogHeader><form key={editing?.day ?? "new"} onSubmit={save} className="space-y-5"><div><label htmlFor="measurement-day" className="mb-2 block text-xs font-medium">Date du relevé</label><input id="measurement-day" name="day" type="date" required min="1900-01-01" max={studioDay()} defaultValue={editing?.day ?? studioDay()} readOnly={!!editing} disabled={busy} className="h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm" /></div><div className="grid grid-cols-2 gap-4">{measurementFields.map(field => <div key={field.key}><label htmlFor={`measurement-${field.key}`} className="mb-2 block text-xs font-medium">{field.label} ({field.unit})</label><input id={`measurement-${field.key}`} name={field.key} type="number" inputMode="decimal" min="0.1" max={field.max} step="0.1" defaultValue={editing?.values[field.key] ?? ""} disabled={busy} className="h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm" /></div>)}</div>{editing && <p className={`text-xs ${muted}`}>La correction conserve une copie de la version précédente. La date du relevé reste inchangée.</p>}{formError && <div role="alert" className="text-sm text-red-700 dark:text-red-300"><p>{formError}</p>{conflict && <button type="button" onClick={() => window.location.reload()} className="mt-2 underline">Recharger la page (abandonner la saisie)</button>}</div>}<DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Annuler</Button><Button type="submit" disabled={busy || conflict}>{busy ? "Enregistrement…" : editing ? "Enregistrer la correction" : "Enregistrer le relevé"}</Button></DialogFooter></form></DialogContent></Dialog>
  </div>;
}
