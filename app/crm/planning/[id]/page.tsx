import Link from "next/link";
import { getPageAccess } from "@/lib/auth/page-access";
import { getPlanningService } from "@/lib/planning/server";
import { displaySessionTime, studioDay } from "@/domain/models/planning";
import { ManagementError } from "@/domain/ports/access-management";
import { ClientShell } from "@/features/clients/client-shell";
import { AccessErrorView } from "@/features/auth/access-error";
import { SessionAction } from "@/features/planning/session-action";
import { AttendanceForm } from "@/features/planning/attendance-form";
import { attendanceOpen } from "@/domain/models/attendance";
import { getRequestTime } from "@/lib/request-time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Séance — Pilates Center Alger", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const result = await getPageAccess(["admin"]);
  if (!result.access) return <AccessErrorView message={result.error} />;
  let details;
  try { details = await getPlanningService().get(result.access, (await params).id); }
  catch (error) { return <AccessErrorView message={error instanceof ManagementError ? error.message : "Séance temporairement indisponible."} />; }
  const { session, attendees } = details;
  const attendanceEditable = attendanceOpen(session, getRequestTime());
  const actionable = session.status === "scheduled" && session.startsAt > getRequestTime();
  return <ClientShell centerId={result.access.centerId} active="planning"><header className="space-y-3"><Link href={`/crm/planning?day=${studioDay(session.startsAt)}`} className="text-sm underline">Retour au planning</Link><h1 className="break-words font-serif text-4xl sm:text-5xl">{session.title}</h1><p>{displaySessionTime(session.startsAt)} · Heure d’Alger</p><p className="text-sm text-muted-foreground">Coach {session.instructor} · {session.durationMinutes} min · {session.bookedCount}/{session.capacity} places réservées</p>{session.status === "cancelled" && <p className="font-medium">Séance annulée — toutes les réservations sont annulées.</p>}</header>
    {session.status === "scheduled" && <section className="space-y-2 rounded-2xl border border-[#ded4c3] p-5"><h2 className="font-serif text-2xl">Feuille de présence</h2><p className="text-sm">{attendanceEditable ? "Renseignez les présences. Les corrections nécessitent un motif et restent dans l’historique." : "Le pointage sera disponible après la fin du cours."}</p><p className="text-sm text-muted-foreground">Aucun crédit supplémentaire n’est débité ou restitué par le pointage.</p><p className="text-sm">{attendees.filter((client) => client.attendance.status === "present").length} présente(s) · {attendees.filter((client) => client.attendance.status === "absent").length} absente(s) · {attendees.filter((client) => client.attendance.status === "unmarked").length} non renseignée(s)</p></section>}
    <section className="space-y-5 rounded-2xl border border-[#ded4c3] bg-[#fffdf9] p-5 sm:p-7"><h2 className="font-serif text-2xl">{session.status === "cancelled" ? "Participantes avant annulation" : "Participantes inscrites"}</h2>{attendees.length === 0 && <p className="text-sm text-muted-foreground">Aucune participante inscrite.</p>}{attendees.map((client) => <article key={client.clientId} className="flex flex-wrap items-center justify-between gap-4 border-t border-[#ded4c3] pt-4"><Link href={`/crm/clientes/${client.clientId}`} className="font-medium underline">{client.name}</Link>{actionable && <SessionAction id={session.id} action="cancel-booking" clientId={client.clientId} label={`Annuler la réservation de ${client.name}`} />}{session.status === "scheduled" && <AttendanceForm key={`${client.clientId}-${client.attendance.version}`} id={session.id} clientId={client.clientId} name={client.name} attendance={client.attendance} editable={attendanceEditable} />}</article>)}</section>
    {actionable && <section className="space-y-4 rounded-2xl border border-[#ded4c3] p-5"><h2 className="font-serif text-xl">Annuler la séance</h2><p className="text-sm text-muted-foreground">L’annulation s’appliquera à toutes les participantes. Aucun message réel ne sera envoyé dans cette démonstration.</p><SessionAction id={session.id} action="cancel-session" label="Annuler cette séance" /></section>}
  </ClientShell>;
}
