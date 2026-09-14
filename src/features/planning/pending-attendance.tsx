import Link from "next/link";
import type { PendingAttendanceReport } from "@/domain/models/attendance";
import { displaySessionTime } from "@/domain/models/planning";

export function PendingAttendance({ report, compact = false }: { report: PendingAttendanceReport; compact?: boolean }) {
  return <section className="space-y-4 rounded-2xl border border-[#ded4c3] bg-[#fffdf9] p-5 sm:p-6" aria-label="Présences à renseigner">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-serif text-2xl">Présences à renseigner</h2>{compact && <Link href="/crm/presences" className="text-sm font-medium text-[#8d6729] underline">Voir toutes les séances et changer les dates</Link>}</div>
    <p className="text-sm text-muted-foreground">Du {report.from.split("-").reverse().join("/")} au {report.to.split("-").reverse().join("/")} · Dates des cours, heure d’Alger</p>
    <p data-testid="pending-attendance-summary" className="font-medium">{report.pending} présence(s) à renseigner sur {report.sessions.length} séance(s)</p>
    {report.sessions.length === 0 ? <p className="text-sm">Aucun pointage en attente sur les cours terminés de cette période.</p> : <div className="space-y-3">{report.sessions.slice(0, compact ? 3 : undefined).map(({ session, pending, total }) => <Link key={session.id} href={`/crm/planning/${session.id}#presences`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e7dfd2] p-4"><div><h3 className="break-words font-medium">{session.title}</h3><p className="text-sm text-muted-foreground">{displaySessionTime(session.startsAt)} · {session.instructor}</p></div><span className="text-sm font-medium text-[#765522]">{pending}/{total} à renseigner →</span></Link>)}</div>}
    <p className="text-xs text-muted-foreground">Les cours en cours ou à venir et les annulations sont exclus. Actualisez pour mettre à jour le suivi.</p>
  </section>;
}
