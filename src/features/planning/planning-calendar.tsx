import Link from "next/link";
import { CalendarDays, Clock, UsersRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SessionAction } from "./session-action";
import { studioDateTime, type PlanningPage } from "@/domain/models/planning";

export function PlanningCalendar({ page, admin, now }: { page: PlanningPage; admin: boolean; now: number }) {
  const path = admin ? "/crm/planning" : "/espace-cliente";
  const current = Date.parse(`${page.day}T12:00:00Z`);
  const previous = new Date(current - 86400000).toISOString().slice(0, 10);
  const nextDay = new Date(current + 86400000).toISOString().slice(0, 10);
  const dateLabel = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeZone: "Africa/Algiers" }).format(current);
  return <div className="space-y-6"><form action={path} className="flex flex-wrap items-end gap-4 rounded-2xl border border-[#ded4c3] bg-[#fffdf9] p-5"><div className="min-w-0 space-y-2"><label htmlFor="planning-day" className="block text-sm font-medium">Choisir une journée</label><Input id="planning-day" name="day" type="date" defaultValue={page.day} key={page.day} required /></div><Button type="submit">Afficher</Button><p className="self-center text-sm text-muted-foreground">Tous les horaires sont ceux d’Alger.</p></form>
    <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="font-serif text-2xl capitalize">{dateLabel}</h2><nav aria-label="Jours du planning" className="flex gap-5 text-sm underline"><Link href={`${path}?day=${previous}`}>Jour précédent</Link><Link href={`${path}?day=${nextDay}`}>Jour suivant</Link></nav></div>
    {page.sessions.length === 0 && <section className="rounded-2xl border border-dashed border-[#c9bda8] px-5 py-14 text-center"><CalendarDays size={34} className="mx-auto mb-4 text-[#b7893b]" /><h3 className="font-serif text-2xl">Aucune séance ce jour</h3><p className="mt-3 text-sm text-muted-foreground">{admin ? "Créez une séance pour ouvrir les réservations." : "Consultez une autre journée pour trouver votre prochaine séance."}</p></section>}
    <div className="grid gap-4 xl:grid-cols-2">{page.sessions.map(({ session, myBooking }) => {
      const ended = session.startsAt <= now;
      const available = session.capacity - session.bookedCount;
      return <article key={session.id} className="space-y-5 rounded-2xl border border-[#ded4c3] bg-[#fffdf9] p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-medium text-[#957035]">{studioDateTime(session.startsAt).slice(11)}</p><h3 className="mt-2 break-words font-serif text-2xl">{session.title}</h3><p className="mt-2 break-words text-sm text-muted-foreground">Coach {session.instructor}</p></div><span className="rounded-full bg-[#ede0c8] px-3 py-1 text-xs text-[#765522]">{session.status === "cancelled" ? "Séance annulée" : ended ? "Séance commencée ou passée" : myBooking === "confirmed" ? "Votre réservation est confirmée" : available === 0 ? "Complet" : `${available} place${available > 1 ? "s" : ""} disponible${available > 1 ? "s" : ""}`}</span></div><div className="flex flex-wrap gap-5 text-sm text-muted-foreground"><span className="flex items-center gap-2"><Clock size={16} />{session.durationMinutes} min</span><span className="flex items-center gap-2"><UsersRound size={16} />{session.bookedCount}/{session.capacity} places réservées</span></div>
        {admin ? <Link href={`/crm/planning/${session.id}`} className="block text-sm font-medium underline">Ouvrir la séance et les participantes</Link> : <>{myBooking === "session-cancelled" && <p className="text-sm">Votre réservation a été annulée avec la séance.</p>}{myBooking === "cancelled" && <p className="text-sm text-muted-foreground">Vous avez annulé votre réservation.</p>}{!ended && session.status === "scheduled" && (myBooking === "confirmed" ? <SessionAction key={`${session.id}-${myBooking}`} id={session.id} action="cancel-booking" label="Annuler ma réservation" /> : available > 0 ? <SessionAction key={`${session.id}-${myBooking}`} id={session.id} action="book" label="Réserver ma place" /> : null)}</>}
      </article>;
    })}</div>
    {page.next && <Link href={`${path}?${new URLSearchParams({ day: page.day, after: page.next })}`} className="block text-sm underline">Séances suivantes de cette journée</Link>}
  </div>;
}
