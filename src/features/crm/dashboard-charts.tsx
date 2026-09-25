"use client";

import Link from "next/link";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, BarChart3, CalendarDays, Clock, CreditCard, Download, RefreshCw } from "lucide-react";
import { type MonthlyCash, type MonthlyPlanning } from "@/domain/models/dashboard-charts";

import styles from "./dashboard.module.css";

const surface = styles.chartCard + " min-w-0 max-w-full rounded-2xl border border-[#ded4c3] bg-[#fffdf9] p-5 dark:border-[#332e26] dark:bg-[#181613]";
const muted = "text-[#807563] dark:text-[#b7a993]";
const colors = ["#b7893b", "#7b8775", "#897068", "#697b89", "#bcaa8a", "#988aab"];
const money = (minor: number) => `${(minor / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} DA`;
const axis = { fontSize: 10, fill: "#95856f" };
const tooltipStyle = { background: "#fffdf9", color: "#29251e", borderRadius: 12, border: "1px solid #ded4c3" };
const dayLabel = (value: unknown) => String(value).slice(8);
const fullDay = (value: unknown) => new Date(`${String(value)}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" });

export function DashboardCharts({ month, planning, cash, planningError, cashError }: { month: string; planning: MonthlyPlanning | null; cash: MonthlyCash | null; planningError?: string; cashError?: string }) {
  const exportUrl = `/api/crm/statistiques/export?month=${encodeURIComponent(month)}`;
  const monthLabel = new Date(`${month}-01T12:00:00Z`).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
  return <section className={styles.charts + " min-w-0 max-w-full space-y-5"} aria-label="Statistiques mensuelles">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a77b37]">03 — Le centre en chiffres</p>
        <h2 className="font-serif text-3xl">Activité du mois</h2>
        <p className={`mt-2 text-xs ${muted}`}>Planning complet du mois sélectionné, séances passées et à venir.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <a href={exportUrl} download className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#b7893b]/30 bg-transparent px-3 text-xs font-medium text-[#8d6729] dark:text-[#d5ae65] hover:bg-[#b7893b]/10 transition-colors">
          <Download size={14} /> Exporter CSV
        </a>
        <form action="/crm" className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="dashboard-month" className={`mb-1 block text-xs ${muted}`}>Période</label>
            <input key={month} id="dashboard-month" name="month" type="month" defaultValue={month} min="2000-01" max="2099-12" required className="h-10 rounded-xl border border-[#b7893b]/30 bg-transparent px-3 text-sm" />
          </div>
          <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#24211b] px-4 text-xs text-white dark:bg-[#d5ae65] dark:text-black">
            <RefreshCw size={13} />Afficher
          </button>
        </form>
      </div>
    </header>

    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
      <article className={surface}>
        <CalendarDays size={18} className="mb-3 text-[#b7893b]" />
        <p className={`text-xs ${muted}`}>Réservations sur les séances maintenues</p>
        <p className="mt-2 font-serif text-3xl">{planning ? planning.summary.bookings.toLocaleString("fr-FR") : "—"}</p>
        <p className={`mt-2 text-xs ${muted}`}>{planning ? `${planning.summary.sessions} séances · ${planning.summary.cancelled} annulées exclues` : "Données indisponibles"}</p>
      </article>
      <article className={surface}>
        <BarChart3 size={18} className="mb-3 text-[#b7893b]" />
        <p className={`text-xs ${muted}`}>Remplissage du mois</p>
        <p className="mt-2 font-serif text-3xl">{planning?.summary.occupancy == null ? "—" : `${planning.summary.occupancy} %`}</p>
        <p className={`mt-2 text-xs ${muted}`}>{planning ? `${planning.summary.bookings} réservées / ${planning.summary.bookings + planning.summary.available} places totales` : "Places réservées / capacité totale"}</p>
      </article>
      <article className={surface}>
        <CreditCard size={18} className="mb-3 text-[#b7893b]" />
        <p className={`text-xs ${muted}`}>Encaissements nets enregistrés</p>
        <p className="mt-2 font-serif text-3xl">{cash ? money(cash.summary.netMinor) : "—"}</p>
        <p className={`mt-2 text-xs ${muted}`}>{cash ? `${cash.summary.count} versements · Mdn. ${money(cash.summary.averageMinorPerActiveDay)}/jour actif (${cash.summary.activeDaysCount}j)` : "Données indisponibles"}</p>
      </article>
    </div>

    <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-2">
      <article className={surface}>
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl">Réservations & capacité</h3>
            <p className={`mt-1 text-xs capitalize ${muted}`}>{monthLabel}</p>
          </div>
          <Link href="/crm/planning" aria-label="Ouvrir le planning" className="text-[#a77b37]">
            <ArrowUpRight size={18} />
          </Link>
        </div>
        {!planning ? <p role="status" className={`py-10 text-sm ${muted}`}>{planningError}</p> : !planning.summary.sessions ? <p className={`py-16 text-center text-sm ${muted}`}>Aucune séance maintenue sur cette période.</p> : <>
          <div className="mb-3 flex flex-wrap gap-4 text-xs">
            <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-[#b7893b]" />Réservées</span>
            <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-[#cfc5b2]" />Non réservées</span>
          </div>
          <div className="h-60" role="img" aria-label="Places réservées et non réservées par jour. Valeurs dans le tableau détaillé.">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 500, height: 240 }}>
              <BarChart data={planning.daily}>
                <CartesianGrid stroke="#b7893b" strokeOpacity={0.12} vertical={false} />
                <XAxis dataKey="day" tickFormatter={dayLabel} tick={axis} minTickGap={12} />
                <YAxis allowDecimals={false} tick={axis} width={30} />
                <Tooltip labelFormatter={fullDay} contentStyle={tooltipStyle} />
                <Bar dataKey="bookings" name="Places réservées" stackId="capacity" fill="#b7893b" />
                <Bar dataKey="available" name="Places non réservées" stackId="capacity" fill="#cfc5b2" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className={`mt-3 text-xs ${muted}`}>Réservations actuelles rattachées au jour de la séance, pas au jour de réservation. Ce graphique ne mesure pas les présences.</p>
        </>}
      </article>

      <article className={surface}>
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl">Encaissements par jour</h3>
            <p className={`mt-1 text-xs ${muted}`}>Espèces enregistrées · DA</p>
          </div>
          <Link href={`/crm/encaissements?month=${month}`} aria-label="Consulter les encaissements" className="text-[#a77b37]">
            <ArrowUpRight size={18} />
          </Link>
        </div>
        {!cash ? <p role="status" className={`py-10 text-sm ${muted}`}>{cashError}</p> : cash.summary.count === 0 ? <p className={`py-16 text-center text-sm ${muted}`}>Aucun encaissement net enregistré sur cette période.</p> : <>
          <div className="h-60" role="img" aria-label="Encaissements nets par jour en dinars. Valeurs dans le tableau détaillé.">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 500, height: 240 }}>
              <AreaChart data={cash.daily.map(day => ({ ...day, amountDzd: day.netMinor / 100 }))}>
                <CartesianGrid stroke="#b7893b" strokeOpacity={0.12} vertical={false} />
                <XAxis dataKey="day" tickFormatter={dayLabel} tick={axis} minTickGap={12} />
                <YAxis tick={axis} width={55} tickFormatter={value => Number(value).toLocaleString("fr-FR", { notation: "compact" })} />
                <Tooltip labelFormatter={fullDay} formatter={value => [`${Number(value).toLocaleString("fr-FR")} DA`, "Encaissements nets"]} contentStyle={tooltipStyle} />
                <Area type="linear" dataKey="amountDzd" stroke="#b7893b" strokeWidth={2} fill="#b7893b" fillOpacity={0.12} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className={`mt-3 text-xs ${muted}`}>Par date de réception déclarée. Écritures corrigées exclues ; ce montant ne représente pas le bénéfice.</p>
        </>}
      </article>
    </div>

    {planning && (
      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-2">
        <article className={surface}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl">Affluence par créneaux horaires</h3>
              <p className={`mt-1 text-xs ${muted}`}>Fréquentation et places réservées par tranche horaire.</p>
            </div>
            <Clock className="h-5 w-5 text-[#b7893b]" />
          </div>
          {planning.timeSlots.some(s => s.sessions > 0) ? (
            <div className="h-56" role="img" aria-label="Répartition des réservations par tranche horaire.">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 500, height: 220 }}>
                <BarChart data={planning.timeSlots}>
                  <CartesianGrid stroke="#b7893b" strokeOpacity={0.12} vertical={false} />
                  <XAxis dataKey="slot" tick={axis} />
                  <YAxis allowDecimals={false} tick={axis} width={30} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(val, name) => [val, name === "bookings" ? "Réservations" : "Capacité"]} />
                  <Bar dataKey="bookings" name="Réservations" fill="#b7893b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="capacity" name="Capacité" fill="#cfc5b2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className={`py-12 text-center text-sm ${muted}`}>Aucune donnée horaire disponible sur ce mois.</p>
          )}
        </article>

        <article className={surface}>
          <div className="grid min-w-0 grid-cols-1 items-center gap-5 md:grid-cols-[200px_minmax(0,1fr)]">
            <div>
              <h3 className="font-serif text-xl">Répartition des cours</h3>
              <p className={`mt-2 text-xs ${muted}`}>Nombre de séances maintenues par intitulé de cours.</p>
            </div>
            {planning.courses.length ? (
              <div className="flex min-w-0 flex-wrap items-center gap-5">
                <div className="h-44 w-44 shrink-0" role="img" aria-label="Répartition des séances par type de cours.">
                  <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 176, height: 176 }}>
                    <PieChart>
                      <Pie data={planning.courses} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2} isAnimationActive={false}>
                        {planning.courses.map((course, index) => (
                          <Cell key={course.name} fill={colors[index % colors.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={value => [`${value} séance(s)`, "Séances"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="min-w-0 basis-full space-y-2 text-xs">
                  {planning.courses.map((course, index) => (
                    <li key={course.name} className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colors[index % colors.length] }} />
                        <span className="break-words font-medium">{course.name}</span>
                      </span>
                      <span className="shrink-0 tabular-nums">{course.value} <span className={muted}>({Math.round(course.value * 100 / planning.summary.sessions)}%)</span></span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className={`text-sm ${muted}`}>Aucune séance à répartir ce mois-ci.</p>
            )}
          </div>
        </article>
      </div>
    )}

    {(planning || cash) && <details className={surface}>
      <summary className="cursor-pointer text-sm font-medium flex items-center justify-between">
        <span>Consulter les données journalières</span>

      </summary>
      <a href={exportUrl} download className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#a77b37] underline"><Download size={13} />Fichier CSV</a>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <caption className={`mb-3 text-left ${muted}`}>Les données indisponibles sont indiquées par un tiret.</caption>
          <thead>
            <tr className="border-b border-[#b7893b]/20">
              {["Jour", "Séances maintenues", "Réservations", "Places non réservées", "Remplissage", "Encaissements nets"].map(label => <th key={label} className="whitespace-nowrap p-3">{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {(planning?.daily ?? cash!.daily).map((row, index) => {
              const p = planning?.daily[index], c = cash?.daily[index];
              return <tr key={row.day} className="border-b border-[#b7893b]/10 hover:bg-[#b7893b]/5">
                <th scope="row" className="whitespace-nowrap p-3 font-normal">{fullDay(row.day)}</th>
                <td className="p-3">{p?.sessions ?? "—"}</td>
                <td className="p-3">{p?.bookings ?? "—"}</td>
                <td className="p-3">{p?.available ?? "—"}</td>
                <td className="p-3">{p?.occupancy == null ? "—" : `${p.occupancy} %`}</td>
                <td className="whitespace-nowrap p-3">{c ? money(c.netMinor) : "—"}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </details>}
  </section>;
}

