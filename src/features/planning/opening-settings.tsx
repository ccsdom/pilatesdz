"use client";
import { useState } from "react";
import Link from "next/link";
import { openingForDay, type OpeningPolicy } from "@/domain/models/opening-policy";
import { studioOpeningSchema, type OpeningRange } from "@/domain/models/studio-opening";
import type { OpeningReview } from "@/repositories/firestore/opening-settings";
const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const format = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const minutes = (s: string) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
const field = "rounded-xl border border-stone-300 bg-white p-2 text-stone-900";
function Ranges({ ranges, change, label }: { ranges: OpeningRange[]; change: (ranges: OpeningRange[]) => void; label: string }) {
  return <div className="space-y-2">{ranges.length === 0 && <p className="text-sm text-stone-500">Fermé</p>}{ranges.map((range, i) => <div key={i} className="flex flex-wrap items-center gap-2">
    <select aria-label={`${label} public ${i + 1}`} className={field} value={range.audience} onChange={e => change(ranges.map((r, n) => n === i ? { ...r, audience: e.target.value as "femme" | "homme" } : r))}><option value="femme">Femmes</option><option value="homme">Hommes</option></select>
    <input aria-label={`${label} début ${i + 1}`} className={field} type="time" value={format(range.startMinute)} onChange={e => change(ranges.map((r, n) => n === i ? { ...r, startMinute: minutes(e.target.value) } : r))} />
    <span>à</span><input aria-label={`${label} fin ${i + 1}`} className={`${field} w-24`} type="time" title="00:00 signifie minuit, en fin de journée" value={Number.isFinite(range.endMinute) ? format(range.endMinute === 1440 ? 0 : range.endMinute) : ""} onChange={e => change(ranges.map((r, n) => n === i ? { ...r, endMinute: e.target.value === "00:00" ? 1440 : minutes(e.target.value) } : r))} />
    <button type="button" className="p-2 text-sm underline" onClick={() => change(ranges.filter((_, n) => n !== i))} aria-label={`Supprimer plage ${i + 1} ${label}`}>Retirer</button>
  </div>)}<button type="button" className="text-sm font-semibold text-amber-800 underline" onClick={() => change([...ranges, { audience: "femme", startMinute: ranges.at(-1)?.endMinute ?? 600, endMinute: (ranges.at(-1)?.endMinute ?? 600) + 60 }])}>Ajouter une plage</button></div>;
}
export function OpeningSettings({ initial, minimum }: { initial: OpeningPolicy; minimum: string }) {
  const [version, setVersion] = useState(initial.version);
  const [effectiveFrom, setDate] = useState([minimum, initial.revisions.at(-1)?.effectiveFrom ?? minimum].sort().at(-1)!);
  const [opening, setOpening] = useState(() => openingForDay(initial, effectiveFrom));
  const [review, setReview] = useState<OpeningReview | null>(null);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  function changed() { setReview(null); setMessage(""); }
  async function submit(action: "preview" | "save") {
    if (!studioOpeningSchema.safeParse(opening).success) { setMessage("Vérifiez les plages : heures complètes, sans chevauchement, dates valides et uniques."); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/crm/horaires", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, expectedVersion: version, effectiveFrom, opening }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Enregistrement impossible.");
      if (action === "save") { setVersion(data.version); setReview(null); setMessage("Horaires enregistrés. Ils s’appliqueront à partir de la date choisie."); }
      else setReview(data);
    } catch (error) { setReview(null); setMessage(error instanceof Error ? error.message : "Réessayez."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6"><header><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Organisation du centre</p><h1 className="mt-3 font-serif text-4xl">Les horaires, à votre rythme.</h1><p className="mt-3 text-sm text-stone-600">Heure d’Alger · 60 minutes · 4 places. Les réservations et les crédits existants sont préservés.</p></header>
    <fieldset disabled={busy} className="space-y-5"><label className="block rounded-2xl border border-stone-200 bg-white p-5 text-stone-900">Appliquer à partir du <input className={`${field} ml-3`} type="date" min={minimum} value={effectiveFrom} onChange={e => { changed(); setDate(e.target.value); }} /><span className="mt-2 block text-sm text-stone-500">Version {version}. Les jours précédents conservent leurs horaires.</span></label>
    <section className="rounded-2xl border border-stone-200 bg-white p-5 text-stone-900"><h2 className="mb-4 font-serif text-2xl">Semaine habituelle</h2>{[6, 0, 1, 2, 3, 4, 5].map(day => <div key={day} className="grid gap-3 border-t border-stone-100 py-4 md:grid-cols-[120px_1fr]"><h3 className="font-semibold">{days[day]}</h3><Ranges label={days[day]} ranges={opening.week[day]} change={ranges => { changed(); setOpening({ ...opening, week: opening.week.map((r, n) => n === day ? ranges : r) }); }} /></div>)}</section>
    <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 text-stone-900"><h2 className="font-serif text-2xl">Exceptions et fermetures</h2><p className="text-sm text-stone-600">Une exception remplace toute la journée. Sans plage, le centre est fermé.</p>{opening.exceptions.map((exception, i) => <div key={i} className="space-y-3 border-t pt-4"><div className="flex flex-wrap gap-3"><input className={field} aria-label={`Date exception ${i + 1}`} type="date" value={exception.day} onChange={e => { changed(); setOpening({ ...opening, exceptions: opening.exceptions.map((x, n) => n === i ? { ...x, day: e.target.value } : x) }); }} /><input className={field} aria-label={`Motif exception ${i + 1}`} placeholder="Motif" maxLength={160} value={exception.reason} onChange={e => { changed(); setOpening({ ...opening, exceptions: opening.exceptions.map((x, n) => n === i ? { ...x, reason: e.target.value } : x) }); }} /><button type="button" onClick={() => { changed(); setOpening({ ...opening, exceptions: opening.exceptions.filter((_, n) => n !== i) }); }}>Retirer l’exception</button></div><Ranges label={`Exception ${i + 1}`} ranges={exception.ranges} change={ranges => { changed(); setOpening({ ...opening, exceptions: opening.exceptions.map((x, n) => n === i ? { ...x, ranges } : x) }); }} /></div>)}<button type="button" className="font-semibold text-amber-800 underline" onClick={() => { changed(); setOpening({ ...opening, exceptions: [...opening.exceptions, { day: effectiveFrom, reason: "Fermeture exceptionnelle", ranges: [] }] }); }}>Ajouter une exception</button></section>
    <button type="button" className="rounded-full bg-stone-900 px-6 py-3 font-semibold text-white disabled:opacity-50" onClick={() => void submit("preview")}>{busy ? "Vérification…" : "Vérifier les conséquences"}</button>
    {review && <section className="space-y-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-stone-900" aria-live="polite"><h2 className="font-serif text-2xl">Avant d’enregistrer</h2><p>{review.closing} créneau(x) à fermer · {review.reopening} à rouvrir · {review.manual} séance(s) manuelle(s) conservée(s).</p>{review.manual > 0 && <p>Les séances manuelles restent proposées, même sur un jour fermé. Vérifiez-les dans le planning.</p>}{review.conflicts.length > 0 ? <><p className="font-semibold">Enregistrement bloqué : des réservations sont concernées.</p><ul>{review.conflicts.map(item => <li key={item.id}><Link className="underline" href={`/crm/planning/${item.id}`}>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Algiers" }).format(item.startsAt)} · {item.bookedCount} réservation(s)</Link></li>)}</ul></> : <><p>Les créneaux vides incompatibles seront fermés. Aucune réservation ne sera annulée.</p><button type="button" className="rounded-full bg-stone-900 px-6 py-3 font-semibold text-white" onClick={() => void submit("save")}>Confirmer et enregistrer</button></>}</section>}
    </fieldset>{message && <p role="status" className="rounded-xl border border-stone-300 p-4">{message}</p>}</div>;
}
