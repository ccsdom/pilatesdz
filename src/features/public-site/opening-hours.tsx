"use client";
import { useEffect, useState } from "react";
import { z } from "zod";
import { openingDateSchema, openingForDay } from "@/domain/models/opening-policy";
import { studioOpeningSchema, type OpeningRange } from "@/domain/models/studio-opening";
import { studioDay } from "@/domain/models/planning";
const publicPolicy = z.object({ revisions: z.array(z.object({ effectiveFrom: openingDateSchema, opening: studioOpeningSchema })) });
export function useOpeningPolicy() {
  const [policy, setPolicy] = useState<z.infer<typeof publicPolicy> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/horaires", { cache: "no-store", signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error();
      const value = publicPolicy.parse(await response.json());
      setPolicy(value);
    }).catch(() => { if (!controller.signal.aborted) setError("Horaires temporairement indisponibles. Actualisez la page pour réessayer."); });
    return () => controller.abort();
  }, []);
  return { policy, error };
}
const time = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}h${String(m % 60).padStart(2, "0")}`;
export const describeRanges = (ranges: OpeningRange[]) => ranges.length ? ranges.map(r => `${r.audience === "femme" ? "Femmes" : "Hommes"} : ${time(r.startMinute)}–${time(r.endMinute)}`).join(" · ") : "Fermé";
export function OpeningHours() {
  const { policy, error } = useOpeningPolicy();
  if (error) return <p role="status">{error}</p>;
  if (!policy) return <p role="status">Chargement des horaires…</p>;
  const day = studioDay();
  const opening = openingForDay(policy, day);
  const future = policy.revisions.filter((r, index, all) => r.effectiveFrom > day && r.effectiveFrom !== all[index + 1]?.effectiveFrom);
  return <div className="space-y-3 text-sm"><dl className="space-y-2">{[6, 0, 1, 2, 3, 4, 5].map(i => <div key={i}><dt className="font-semibold">{["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"][i]}</dt><dd>{describeRanges(opening.week[i])}</dd></div>)}</dl>{opening.exceptions.filter(e => e.day >= day && (!future[0] || e.day < future[0].effectiveFrom)).map(e => <p key={e.day}><strong>{e.day}</strong> : {describeRanges(e.ranges)}</p>)}{future.map((next, index) => <div key={next.effectiveFrom} className="border-t pt-3"><p className="font-semibold">À partir du {next.effectiveFrom.split("-").reverse().join("/")}</p>{next.opening.week.map((ranges, i) => <p key={i}>{["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"][i]} : {describeRanges(ranges)}</p>)}{next.opening.exceptions.filter(e => e.day >= next.effectiveFrom && (!future[index + 1] || e.day < future[index + 1].effectiveFrom)).map(e => <p key={e.day}>{e.day} : {describeRanges(e.ranges)}</p>)}</div>)}<p>Heure d’Alger · Créneaux d’une heure. Les disponibilités du calendrier tiennent compte des exceptions.</p></div>;
}
