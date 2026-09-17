"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LayoutGrid,
  CalendarDays,
  CalendarRange,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  UsersRound,
  Plus,
  Filter,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import {
  studioDateTime,
  studioDay,
  getDaysOfWeek,
  getDaysOfMonthGrid,
  weekRange,
  monthRange,
  type PilatesSession,
} from "@/domain/models/planning";
import { Button } from "@/components/ui/button";

export type ViewMode = "grid" | "day" | "week" | "month";

interface CrmPlanningViewsProps {
  sessions: PilatesSession[];
  initialView?: ViewMode;
  initialDay: string;
  now: number;
}

const DAYS_FRENCH_SHORT = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];
const MONTHS_FRENCH = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export function CrmPlanningViews({
  sessions,
  initialView = "week",
  initialDay,
  now,
}: CrmPlanningViewsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [view, setView] = useState<ViewMode>(
    (searchParams.get("view") as ViewMode) || initialView
  );
  const [selectedDay, setSelectedDay] = useState<string>(
    searchParams.get("day") || initialDay
  );
  const [instructorFilter, setInstructorFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const todayStr = useMemo(() => studioDay(now), [now]);
  const currentMonthStr = useMemo(() => selectedDay.slice(0, 7), [selectedDay]);

  // Extract unique instructors for filter dropdown
  const instructors = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => set.add(s.instructor));
    return Array.from(set).sort();
  }, [sessions]);

  // Filter sessions based on controls
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (instructorFilter !== "all" && s.instructor !== instructorFilter) return false;
      if (statusFilter === "cancelled" && s.status !== "cancelled") return false;
      if (statusFilter === "full" && (s.status === "cancelled" || s.bookedCount < s.capacity)) return false;
      if (statusFilter === "available" && (s.status === "cancelled" || s.bookedCount >= s.capacity)) return false;
      return true;
    });
  }, [sessions, instructorFilter, statusFilter]);

  // Handle URL updates when switching view or date
  const updateUrl = (newView: ViewMode, newDay: string) => {
    setView(newView);
    setSelectedDay(newDay);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newView);
    params.set("day", newDay);
    router.push(`/crm/planning?${params.toString()}`);
  };

  // Date Navigation Helpers
  const handleToday = () => updateUrl(view, todayStr);

  const handlePrev = () => {
    if (view === "month") {
      const { prevYearMonth } = monthRange(currentMonthStr);
      updateUrl(view, `${prevYearMonth}-01`);
    } else if (view === "week") {
      const currentNoon = Date.parse(`${selectedDay}T12:00:00Z`);
      const prevWeekNoon = currentNoon - 7 * 86400000;
      updateUrl(view, studioDay(prevWeekNoon));
    } else {
      const currentNoon = Date.parse(`${selectedDay}T12:00:00Z`);
      const prevDayNoon = currentNoon - 86400000;
      updateUrl(view, studioDay(prevDayNoon));
    }
  };

  const handleNext = () => {
    if (view === "month") {
      const { nextYearMonth } = monthRange(currentMonthStr);
      updateUrl(view, `${nextYearMonth}-01`);
    } else if (view === "week") {
      const currentNoon = Date.parse(`${selectedDay}T12:00:00Z`);
      const nextWeekNoon = currentNoon + 7 * 86400000;
      updateUrl(view, studioDay(nextWeekNoon));
    } else {
      const currentNoon = Date.parse(`${selectedDay}T12:00:00Z`);
      const nextDayNoon = currentNoon + 86400000;
      updateUrl(view, studioDay(nextDayNoon));
    }
  };

  // Format Header Date Title
  const periodLabel = useMemo(() => {
    const noon = Date.parse(`${selectedDay}T12:00:00Z`);
    if (view === "month") {
      const [y, m] = currentMonthStr.split("-").map(Number);
      return `${MONTHS_FRENCH[m - 1]} ${y}`;
    }
    if (view === "week") {
      const weekDays = getDaysOfWeek(selectedDay);
      const first = weekDays[0];
      const last = weekDays[6];
      const d1 = parseInt(first.slice(8, 10), 10);
      const d2 = parseInt(last.slice(8, 10), 10);
      const m1 = MONTHS_FRENCH[parseInt(first.slice(5, 7), 10) - 1];
      const m2 = MONTHS_FRENCH[parseInt(last.slice(5, 7), 10) - 1];
      if (m1 === m2) return `${d1} — ${d2} ${m1} ${first.slice(0, 4)}`;
      return `${d1} ${m1} — ${d2} ${m2} ${last.slice(0, 4)}`;
    }
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "full",
      timeZone: "Africa/Algiers",
    }).format(noon);
  }, [selectedDay, view, currentMonthStr]);

  // Overall Stats
  const totalBooked = filteredSessions.reduce((acc, s) => acc + (s.status === "cancelled" ? 0 : s.bookedCount), 0);
  const totalCapacity = filteredSessions.reduce((acc, s) => acc + (s.status === "cancelled" ? 0 : s.capacity), 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* TOOLBAR CONTROLS HEADER */}
      <div className="flex flex-col gap-4 rounded-3xl border border-[#e5dbc9] bg-[#fffdf9] p-4 sm:p-6 shadow-sm">
        {/* Top Row: View Switcher & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Segmented Control Switcher */}
          <div className="inline-flex rounded-2xl border border-[#ded4c3] bg-[#f7f2e9] p-1.5 shadow-inner">
            <button
              onClick={() => updateUrl("grid", selectedDay)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                view === "grid"
                  ? "bg-[#111] text-white shadow"
                  : "text-[#6b6255] hover:text-[#111]"
              }`}
            >
              <LayoutGrid size={17} />
              <span className="hidden sm:inline">Grille</span>
            </button>

            <button
              onClick={() => updateUrl("day", selectedDay)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                view === "day"
                  ? "bg-[#111] text-white shadow"
                  : "text-[#6b6255] hover:text-[#111]"
              }`}
            >
              <Clock size={17} />
              <span className="hidden sm:inline">Journée</span>
            </button>

            <button
              onClick={() => updateUrl("week", selectedDay)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                view === "week"
                  ? "bg-[#111] text-white shadow"
                  : "text-[#6b6255] hover:text-[#111]"
              }`}
            >
              <CalendarRange size={17} />
              <span className="hidden sm:inline">Semaine</span>
            </button>

            <button
              onClick={() => updateUrl("month", selectedDay)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                view === "month"
                  ? "bg-[#111] text-white shadow"
                  : "text-[#6b6255] hover:text-[#111]"
              }`}
            >
              <CalendarIcon size={17} />
              <span className="hidden sm:inline">Mensuelle</span>
            </button>
          </div>

          {/* New Session Button */}
          <div className="flex items-center gap-3">
            <Link
              href="/crm/planning/nouvelle"
              className="inline-flex items-center gap-2 rounded-xl bg-[#b7893b] hover:bg-[#a37830] px-4 py-2.5 text-sm font-semibold text-white shadow transition-all hover:scale-[1.02]"
            >
              <Plus size={18} />
              <span>Créer une séance</span>
            </Link>
          </div>
        </div>

        {/* Bottom Row: Navigation & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#eee5d8]">
          {/* Navigation Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="rounded-xl border-[#dcd1be] bg-[#fffdf9] hover:bg-[#f7f2e9] text-xs font-semibold text-[#665a49]"
            >
              Aujourd’hui
            </Button>
            <div className="flex items-center rounded-xl border border-[#dcd1be] bg-[#fffdf9] p-0.5 shadow-sm">
              <button
                onClick={handlePrev}
                className="p-1.5 hover:bg-[#f5efe4] rounded-lg transition text-[#554a39]"
                title="Précédent"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 hover:bg-[#f5efe4] rounded-lg transition text-[#554a39]"
                title="Suivant"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-medium text-[#111] capitalize">
              {periodLabel}
            </h2>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Instructor filter */}
            {instructors.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Filter size={14} className="text-[#887c6b]" />
                <select
                  value={instructorFilter}
                  onChange={(e) => setInstructorFilter(e.target.value)}
                  className="rounded-xl border border-[#ded4c3] bg-[#fffdf9] px-3 py-1.5 text-xs font-medium text-[#443c30] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#b7893b]"
                >
                  <option value="all">Tous les coachs</option>
                  {instructors.map((ins) => (
                    <option key={ins} value={ins}>
                      Coach {ins}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[#ded4c3] bg-[#fffdf9] px-3 py-1.5 text-xs font-medium text-[#443c30] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#b7893b]"
            >
              <option value="all">Tous les statuts</option>
              <option value="available">Disponibles</option>
              <option value="full">Complets</option>
              <option value="cancelled">Annulés</option>
            </select>

            {/* Date picker jump */}
            <input
              type="date"
              value={selectedDay}
              onChange={(e) => e.target.value && updateUrl(view, e.target.value)}
              className="rounded-xl border border-[#ded4c3] bg-[#fffdf9] px-2.5 py-1 text-xs font-medium text-[#443c30] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#b7893b]"
            />
          </div>
        </div>

        {/* Period Summary Stats Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f8f4ec] px-4 py-2.5 text-xs text-[#6e6353]">
          <div className="flex flex-wrap gap-4 font-medium">
            <span>
              <strong className="text-[#111]">{filteredSessions.length}</strong> séance(s) au total
            </span>
            <span>·</span>
            <span>
              <strong className="text-[#8b652b]">{totalBooked}</strong> / {totalCapacity} places occupées
            </span>
            <span>·</span>
            <span>
              Taux d'occupation : <strong className="text-[#111]">{occupancyRate}%</strong>
            </span>
          </div>
          <span className="text-[11px] text-[#887c6c]">Toutes les heures sont celles d'Alger (UTC+1)</span>
        </div>
      </div>

      {/* RENDER SELECTED VIEW */}
      {view === "grid" && (
        <GridView sessions={filteredSessions} now={now} />
      )}
      {view === "day" && (
        <DayView sessions={filteredSessions} selectedDay={selectedDay} now={now} />
      )}
      {view === "week" && (
        <WeekView
          sessions={filteredSessions}
          selectedDay={selectedDay}
          now={now}
          todayStr={todayStr}
          onSelectDay={(day) => updateUrl("day", day)}
        />
      )}
      {view === "month" && (
        <MonthView
          sessions={filteredSessions}
          yearMonth={currentMonthStr}
          todayStr={todayStr}
          onSelectDay={(day) => updateUrl("day", day)}
        />
      )}
    </div>
  );
}

/* =========================================================================
   VUE 1: GRID VIEW (Grille de cartes épurées)
   ========================================================================= */
function GridView({ sessions, now }: { sessions: PilatesSession[]; now: number }) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[#c9bda8] bg-[#fffdf9] p-12 text-center shadow-sm">
        <CalendarDays size={40} className="mx-auto mb-3 text-[#b7893b] opacity-80" />
        <h3 className="font-serif text-2xl text-[#111]">Aucune séance sur cette sélection</h3>
        <p className="mt-2 text-sm text-[#776c5c]">
          Modifiez vos filtres ou créez une séance pour ouvrir les réservations.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {sessions.map((s) => {
        const ended = s.startsAt <= now;
        const available = s.capacity - s.bookedCount;
        const fillPercent = Math.min(100, Math.round((s.bookedCount / s.capacity) * 100));

        return (
          <article
            key={s.id}
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#ded4c3] bg-[#fffdf9] p-6 shadow-sm hover:shadow-md hover:border-[#b7893b] transition-all"
          >
            {/* Top Accent Bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 ${
                s.status === "cancelled"
                  ? "bg-rose-500"
                  : ended
                  ? "bg-[#a89b88]"
                  : fillPercent >= 100
                  ? "bg-amber-600"
                  : "bg-[#b7893b]"
              }`}
            />

            <div className="space-y-4 pt-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block rounded-lg bg-[#f4ece0] px-3 py-1 text-xs font-bold text-[#765522]">
                    {studioDateTime(s.startsAt).slice(11)}
                  </span>
                  <p className="mt-1 text-xs text-[#8c8172]">
                    {studioDateTime(s.startsAt).slice(0, 10)}
                  </p>
                </div>

                {/* Badge Status */}
                {s.status === "cancelled" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
                    <XCircle size={13} /> Annulée
                  </span>
                ) : ended ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#eee5d8] px-3 py-1 text-xs font-medium text-[#736857]">
                    Terminée
                  </span>
                ) : available === 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    <AlertCircle size={13} /> Complet
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                    <CheckCircle2 size={13} /> {available} libre(s)
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-serif text-2xl font-medium text-[#111] group-hover:text-[#b7893b] transition-colors">
                  {s.title}
                </h3>
                <p className="mt-1 text-sm font-medium text-[#786c5c]">
                  Coach {s.instructor}
                </p>
              </div>

              {/* Jauge d'occupation */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs text-[#6e6252]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <UsersRound size={14} /> Occupation
                  </span>
                  <span className="font-bold text-[#111]">
                    {s.bookedCount} / {s.capacity} clientes
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#eee6d8]">
                  <div
                    className={`h-full transition-all duration-500 ${
                      s.status === "cancelled"
                        ? "bg-rose-400"
                        : fillPercent >= 100
                        ? "bg-amber-600"
                        : fillPercent >= 75
                        ? "bg-[#b7893b]"
                        : "bg-[#d1aa65]"
                    }`}
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-[#776b5b]">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} /> {s.durationMinutes} minutes
                </span>
              </div>
            </div>

            {/* Card Action Link */}
            <div className="mt-6 pt-4 border-t border-[#f0e7da] flex items-center justify-between">
              <Link
                href={`/crm/planning/${s.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8d6729] hover:text-[#111] transition-colors"
              >
                <span>Gérer la séance & émarge</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/* =========================================================================
   VUE 2: DAY VIEW (Timeline horaire verticale 08:00 - 21:00)
   ========================================================================= */
function DayView({
  sessions,
  selectedDay,
  now,
}: {
  sessions: PilatesSession[];
  selectedDay: string;
  now: number;
}) {
  const daySessions = useMemo(() => {
    return sessions
      .filter((s) => studioDay(s.startsAt) === selectedDay)
      .sort((a, b) => a.startsAt - b.startsAt);
  }, [sessions, selectedDay]);

  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 to 21:00

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#ded4c3] bg-[#fffdf9] p-6 shadow-sm">
        <h3 className="font-serif text-xl font-medium text-[#111] mb-4">
          Agenda de la journée
        </h3>

        {daySessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#c9bda8] p-8 text-center text-sm text-[#776c5c]">
            Aucun cours programmé ce jour.
          </div>
        ) : (
          <div className="space-y-4">
            {hours.map((hour) => {
              const hourFormatted = `${String(hour).padStart(2, "0")}:00`;
              const hourSessions = daySessions.filter((s) => {
                const sHour = parseInt(studioDateTime(s.startsAt).slice(11, 13), 10);
                return sHour === hour;
              });

              return (
                <div
                  key={hour}
                  className="grid grid-cols-[60px_1fr] gap-4 min-h-[70px] border-b border-[#f3ebde] pb-3"
                >
                  <span className="text-xs font-bold text-[#8c8070] pt-1">
                    {hourFormatted}
                  </span>

                  <div className="space-y-2">
                    {hourSessions.length === 0 ? (
                      <div className="h-full rounded-xl border border-dashed border-transparent hover:border-[#e0d6c5] transition-colors p-2 text-xs text-[#a09484]">
                        Libre
                      </div>
                    ) : (
                      hourSessions.map((s) => {
                        const ended = s.startsAt <= now;
                        return (
                          <Link
                            key={s.id}
                            href={`/crm/planning/${s.id}`}
                            className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm transition-all hover:scale-[1.01] ${
                              s.status === "cancelled"
                                ? "bg-rose-50/50 border-rose-200"
                                : ended
                                ? "bg-[#f5efe6] border-[#ddd3c3]"
                                : "bg-[#fff9ef] border-[#e7d8be] hover:border-[#b7893b]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="h-10 w-1.5 rounded-full bg-[#b7893b]" />
                              <div>
                                <span className="text-xs font-bold text-[#8b652b]">
                                  {studioDateTime(s.startsAt).slice(11)} ({s.durationMinutes} min)
                                </span>
                                <h4 className="font-serif text-lg font-medium text-[#111]">
                                  {s.title}
                                </h4>
                                <p className="text-xs text-[#786c5c]">
                                  Coach {s.instructor}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="rounded-full bg-[#ede0c8] px-3 py-1 text-xs font-semibold text-[#765522]">
                                {s.status === "cancelled"
                                  ? "Annulée"
                                  : `${s.bookedCount} / ${s.capacity} inscrites`}
                              </span>
                              <span className="text-xs font-bold text-[#8b652b] underline">
                                Voir la feuille →
                              </span>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   VUE 3: WEEK VIEW (Grille 7 jours Lundi-Dimanche)
   ========================================================================= */
function WeekView({
  sessions,
  selectedDay,
  now,
  todayStr,
  onSelectDay,
}: {
  sessions: PilatesSession[];
  selectedDay: string;
  now: number;
  todayStr: string;
  onSelectDay: (day: string) => void;
}) {
  const weekDays = useMemo(() => getDaysOfWeek(selectedDay), [selectedDay]);

  return (
    <div className="overflow-x-auto rounded-3xl border border-[#ded4c3] bg-[#fffdf9] shadow-sm p-4 sm:p-6">
      <div className="min-w-[900px] grid grid-cols-7 gap-3">
        {weekDays.map((dayStr, index) => {
          const isToday = dayStr === todayStr;
          const dayNum = parseInt(dayStr.slice(8, 10), 10);
          const monthName = MONTHS_FRENCH[parseInt(dayStr.slice(5, 7), 10) - 1].slice(0, 4);

          const daySessions = sessions
            .filter((s) => studioDay(s.startsAt) === dayStr)
            .sort((a, b) => a.startsAt - b.startsAt);

          return (
            <div
              key={dayStr}
              className={`flex flex-col rounded-2xl border p-3 transition-all ${
                isToday
                  ? "border-[#b7893b] bg-[#fbf7ef] shadow-sm"
                  : "border-[#eadecb] bg-[#fffdf9]"
              }`}
            >
              {/* Day Column Header */}
              <button
                onClick={() => onSelectDay(dayStr)}
                className="text-left mb-3 border-b border-[#eee3d1] pb-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#887c6b]">
                    {DAYS_FRENCH_SHORT[index]}
                  </span>
                  {isToday && (
                    <span className="rounded-full bg-[#b7893b] px-2 py-0.5 text-[10px] font-bold text-white">
                      Aujourd'hui
                    </span>
                  )}
                </div>
                <h4 className="font-serif text-xl font-bold text-[#111] group-hover:text-[#b7893b] transition-colors">
                  {dayNum} <span className="text-xs font-normal text-[#7a6f60]">{monthName}</span>
                </h4>
              </button>

              {/* Sessions in day */}
              <div className="flex-1 space-y-2.5">
                {daySessions.length === 0 ? (
                  <p className="py-6 text-center text-xs text-[#a39786] italic">
                    Aucun cours
                  </p>
                ) : (
                  daySessions.map((s) => {
                    const ended = s.startsAt <= now;
                    return (
                      <Link
                        key={s.id}
                        href={`/crm/planning/${s.id}`}
                        className={`block rounded-xl border p-2.5 text-xs shadow-2xs transition-all hover:scale-[1.02] ${
                          s.status === "cancelled"
                            ? "bg-rose-50 border-rose-200 text-rose-900"
                            : ended
                            ? "bg-[#f5efe5] border-[#dfd6c6]"
                            : "bg-[#fff8ec] border-[#e7d8bd] hover:border-[#b7893b]"
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-[#8b652b]">
                          <span>{studioDateTime(s.startsAt).slice(11)}</span>
                          <span className="text-[10px] font-semibold opacity-80">
                            {s.bookedCount}/{s.capacity}
                          </span>
                        </div>
                        <p className="mt-1 font-semibold text-[#111] truncate">{s.title}</p>
                        <p className="text-[11px] text-[#786b5b] truncate">Coach {s.instructor}</p>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================================
   VUE 4: MONTH VIEW (Grille calendaire du mois complet)
   ========================================================================= */
function MonthView({
  sessions,
  yearMonth,
  todayStr,
  onSelectDay,
}: {
  sessions: PilatesSession[];
  yearMonth: string;
  todayStr: string;
  onSelectDay: (day: string) => void;
}) {
  const monthGrid = useMemo(() => getDaysOfMonthGrid(yearMonth), [yearMonth]);

  // Group sessions by date string
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, PilatesSession[]>();
    sessions.forEach((s) => {
      const d = studioDay(s.startsAt);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(s);
    });
    return map;
  }, [sessions]);

  return (
    <div className="rounded-3xl border border-[#ded4c3] bg-[#fffdf9] p-4 sm:p-6 shadow-sm overflow-x-auto">
      <div className="min-w-[750px]">
        {/* Day Header Row */}
        <div className="grid grid-cols-7 gap-2 mb-3 text-center border-b border-[#eee3d1] pb-2">
          {DAYS_FRENCH_SHORT.map((dayName) => (
            <span key={dayName} className="text-xs font-bold text-[#8c8070]">
              {dayName}
            </span>
          ))}
        </div>

        {/* Calendar Matrix (6 weeks x 7 days) */}
        <div className="grid grid-cols-7 gap-2">
          {monthGrid.map(({ date, dayNumber, isCurrentMonth }) => {
            const isToday = date === todayStr;
            const daySessions = sessionsByDate.get(date) || [];

            return (
              <div
                key={date}
                onClick={() => onSelectDay(date)}
                className={`group flex flex-col justify-between rounded-2xl border p-2.5 min-h-[105px] cursor-pointer transition-all hover:border-[#b7893b] ${
                  isToday
                    ? "border-[#b7893b] bg-[#fcf8f0] shadow-sm"
                    : isCurrentMonth
                    ? "border-[#ebdcc8] bg-[#fffdf9] hover:bg-[#faf4ea]"
                    : "border-transparent bg-[#f9f6f0] opacity-40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      isToday
                        ? "bg-[#b7893b] text-white"
                        : isCurrentMonth
                        ? "text-[#111]"
                        : "text-[#998e7e]"
                    }`}
                  >
                    {dayNumber}
                  </span>

                  {daySessions.length > 0 && (
                    <span className="rounded-full bg-[#efe3d0] px-1.5 py-0.5 text-[10px] font-bold text-[#765522]">
                      {daySessions.length}
                    </span>
                  )}
                </div>

                {/* Session Chips */}
                <div className="mt-1 space-y-1">
                  {daySessions.slice(0, 2).map((s) => (
                    <div
                      key={s.id}
                      className={`truncate rounded-lg px-1.5 py-0.5 text-[10px] font-semibold ${
                        s.status === "cancelled"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-[#f4ebe0] text-[#6b4c1b]"
                      }`}
                    >
                      {studioDateTime(s.startsAt).slice(11)} {s.title}
                    </div>
                  ))}
                  {daySessions.length > 2 && (
                    <div className="text-[10px] font-bold text-[#8b652b] pl-1">
                      +{daySessions.length - 2} autre(s)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
