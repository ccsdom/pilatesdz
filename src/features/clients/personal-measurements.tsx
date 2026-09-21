"use client";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { measurementFields, type PersonalMeasurementPage, type MeasurementKey } from "@/domain/models/measurements";
import { Button } from "@/components/ui/button";

export function PersonalMeasurements({ initial }: { initial: PersonalMeasurementPage }) {
  const [records, setRecords] = useState(initial.measurements);
  const [next, setNext] = useState(initial.next);
  const [metric, setMetric] = useState<MeasurementKey>("weight");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const field = measurementFields.find(item => item.key === metric)!;
  const points = records.filter(record => record.values[metric] !== undefined).map(record => ({ date: Date.parse(`${record.day}T12:00:00Z`), value: record.values[metric] })).sort((a, b) => a.date - b.date);
  const date = (value: number) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "UTC" }).format(value);
  async function more() {
    if (busy || !next) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/mensurations?after=${encodeURIComponent(next)}`, { cache: "no-store" });
      const page = await response.json();
      if (!response.ok) throw new Error(page.error || "Chargement impossible.");
      setRecords(previous => [...new Map([...previous, ...(page as PersonalMeasurementPage).measurements].map(record => [record.day, record])).values()]);
      setNext(page.next);
    } catch { setError("Les relevés ne sont pas disponibles pour le moment. Réessayez."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6"><section className="rounded-2xl border border-[#ded4c3] bg-[#fffdf9] p-5 text-[#1c1917]"><div className="flex flex-wrap items-center justify-between gap-4"><h2 className="font-serif text-2xl">Mon évolution</h2><label className="text-sm">Mesure<select className="ml-3 rounded-lg border bg-white p-2" value={metric} onChange={event => setMetric(event.target.value as MeasurementKey)}>{measurementFields.map(item => <option key={item.key} value={item.key}>{item.label} ({item.unit})</option>)}</select></label></div>{points.length >= 2 ? <div className="mt-6 h-64" role="img" aria-label={`Évolution : ${field.label}. Valeurs détaillées dans le tableau ci-dessous.`}><ResponsiveContainer width="100%" height="100%"><LineChart data={points}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" type="number" domain={["dataMin", "dataMax"]} tickFormatter={date} /><YAxis domain={["auto", "auto"]} unit={` ${field.unit}`} /><Tooltip labelFormatter={value => date(Number(value))} /><Line dataKey="value" name={field.label} stroke="#a77b37" strokeWidth={2} dot /></LineChart></ResponsiveContainer></div> : <p className="py-8 text-sm text-stone-600">{records.length ? "Deux relevés de cette mesure sont nécessaires pour afficher son évolution." : "Votre suivi apparaîtra ici dès le premier relevé effectué au studio."}</p>}</section><section className="rounded-2xl border p-5"><h2 className="mb-4 font-serif text-2xl">Mes relevés</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Mes mensurations par date ; un tiret signifie non renseigné.</caption><thead><tr><th className="p-3">Date</th>{measurementFields.map(item => <th className="whitespace-nowrap p-3" key={item.key}>{item.label} ({item.unit})</th>)}</tr></thead><tbody>{records.map(record => <tr key={record.day} className="border-t"><th className="whitespace-nowrap p-3 font-medium">{date(Date.parse(`${record.day}T12:00:00Z`))}</th>{measurementFields.map(item => <td className="p-3 tabular-nums" key={item.key}>{record.values[item.key]?.toLocaleString("fr-FR") ?? "—"}</td>)}</tr>)}</tbody></table></div>{!records.length && <p className="py-4 text-sm">Aucun relevé enregistré.</p>}{next && <Button className="mt-5" variant="outline" onClick={more} disabled={busy}>{busy ? "Chargement…" : "Voir les relevés précédents"}</Button>}{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}</section><p className="text-xs text-muted-foreground">Vos mesures sont privées. Contactez le studio si un relevé doit être corrigé.</p></div>;
}
