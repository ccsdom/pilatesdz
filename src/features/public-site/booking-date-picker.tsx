"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { bookingCalendarDate, bookingMonthDays, shiftBookingMonth } from "@/domain/models/public-booking-calendar";

import { useOpeningPolicy } from "./opening-hours";
import { openingForDay } from "@/domain/models/opening-policy";
import { openingRanges } from "@/domain/models/studio-opening";

export function BookingDatePicker({ value, minimum, onChange }: { value: string; minimum: string; onChange: (day: string) => void }) {
  const { policy, error: scheduleError } = useOpeningPolicy();
  function canSelectBookingDay(day: string, minimum: string) {
    try { return day >= minimum && policy !== null && openingRanges(day, openingForDay(policy, day)).length > 0; } catch { return false; }
  }
  const [month, setMonth] = useState(value.slice(0, 7));
  const [error, setError] = useState("");
  const days = bookingMonthDays(month);
  const offset = (bookingCalendarDate(days[0]).getUTCDay() + 6) % 7;
  const label = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(bookingCalendarDate(days[0]));
  function select(day: string) {
    if (!canSelectBookingDay(day, minimum)) { setError("Choisissez une date ouverte à partir de demain."); return; }
    setError(""); setMonth(day.slice(0, 7)); onChange(day);
  }
  return <section aria-label="Date de la séance" className="space-y-4 rounded-3xl border border-[#e5dacf] bg-white p-4 sm:p-6">
    <p className="text-xs font-bold uppercase tracking-wider text-[#786c5e]">1. Sélectionnez le jour de votre séance</p>
    <p className="text-sm text-[#61574b]">Vous pouvez choisir une date dans les mois suivants. Les jours fermés tiennent compte des horaires et des exceptions du centre.</p>
    <div className="flex items-center justify-between gap-3"><button type="button" aria-label="Mois précédent" disabled={month <= minimum.slice(0, 7)} onClick={() => setMonth(shiftBookingMonth(month, -1))} className="rounded-full border p-3 disabled:opacity-30"><ArrowLeft size={18} /></button><h3 aria-live="polite" className="font-serif text-xl capitalize">{label}</h3><button type="button" aria-label="Mois suivant" onClick={() => setMonth(shiftBookingMonth(month, 1))} className="rounded-full border p-3"><ArrowRight size={18} /></button></div>
    <div className="grid grid-cols-7 gap-1 sm:gap-2"><div className="contents" aria-hidden="true">{["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(day => <span key={day} className="py-2 text-center text-xs text-[#786c5e]">{day}</span>)}</div>{Array.from({ length: offset }, (_, i) => <span key={`empty-${i}`} />)}{days.map(day => {
      const enabled = canSelectBookingDay(day, minimum), selected = day === value;
      return <button key={day} type="button" aria-label={new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeZone: "UTC" }).format(bookingCalendarDate(day))} aria-pressed={selected} disabled={!enabled} onClick={() => select(day)} className={`min-h-11 rounded-xl border text-sm transition ${selected ? "border-[#b7893b] bg-[#1c1917] text-white" : "border-[#e5dacf] text-[#1c1917] hover:border-[#b7893b]"} disabled:cursor-not-allowed disabled:opacity-30`}>{Number(day.slice(8))}</button>;
    })}</div>
    <div className="space-y-2"><label htmlFor="booking-date" className="block text-sm font-medium">Choisir directement une date</label><input id="booking-date" type="date" min={minimum} value={value} onChange={e => select(e.target.value)} className="w-full min-w-0 rounded-xl border border-[#dccbb0] px-4 py-3 text-sm" /></div>
    {scheduleError && <p role="alert">{scheduleError}</p>}
    {!policy && !scheduleError && <p role="status">Chargement des jours d’ouverture…</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </section>;
}
