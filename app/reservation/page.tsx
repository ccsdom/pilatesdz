import Link from "next/link";
import { ArrowUpRight, Phone, Plus } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { PublicHeader } from "@/components/brand/public-header";
import { BookingWizard } from "@/features/public-site/booking-wizard";
import { COURSE_DURATION_MINUTES, COURSE_MAX_CAPACITY } from "@/domain/models/studio-offers";
import s from "@/features/public-site/public-site.module.css";
import v from "./reservation.module.css";

export const metadata = {
  title: "Réserver une séance · Pilates Center Alger",
  description: "Choisissez votre séance de Pilates et votre créneau à Bir Mourad Raïs. Une heure, quatre places maximum. Réservation en ligne, règlement au studio.",
};

export default function ReservationPage() {
  return <div className={`${s.site} ${v.page}`}>
    <a href="#reservation-contenu" className={s.skip}>Aller au contenu</a>
    <PublicHeader />
    <main id="reservation-contenu" className={v.main}>
      <div className={v.intro}><p className={s.eyebrow}>Votre prochaine séance</p><h1>Une heure pour vous.<br /><em>Réservez votre place.</em></h1><p>Choisissez votre séance, puis un créneau disponible.</p><div className={v.facts}><span>{COURSE_DURATION_MINUTES} minutes</span><span>{COURSE_MAX_CAPACITY} places maximum</span><span>Paiement au studio</span></div></div>
      <section aria-label="Réserver une séance" className={v.booking}><BookingWizard/></section>
      <div className={v.help}><p>Besoin d’un coup de main ?</p><a href="tel:0553021714"><Phone size={16}/>05 53 02 17 14 <ArrowUpRight size={16}/></a></div>
      <section className={v.faq} aria-label="Informations pratiques">{[["Comment régler ma séance ?", "Le règlement s’effectue en espèces au centre. Si vous avez déjà un forfait, connectez-vous à votre espace cliente pour réserver avec vos crédits."], ["Comment modifier ou annuler ma réservation ?", "Depuis votre espace cliente, annulez avant le début du créneau pour libérer le crédit réservé. Pour changer d’horaire, annulez puis réservez une autre place disponible."], ["Où se trouve le studio ?", "Au Centre commercial Zemzem, à Bir Mourad Raïs, Alger. Appelez-nous au 05 53 02 17 14 pour préparer votre venue."]].map(([q,a])=><details key={q}><summary>{q}<Plus size={16} aria-hidden="true"/></summary><p>{a}</p></details>)}</section>
    </main>
    <footer className={s.footer}><div className={s.wrap}><div className={s.footerTop}><Link href="/" aria-label="Pilates Center — Accueil"><BrandLockup light/></Link><p>Force. Équilibre. Harmonie.</p><Link href="/contact">Contacter le studio <ArrowUpRight size={16}/></Link></div><div className={s.footerBottom}><span>© {new Date().getFullYear()} Pilates Center Alger</span><nav aria-label="Informations légales"><Link href="/mentions-legales">Mentions légales</Link><Link href="/politique-de-confidentialite">Confidentialité</Link><Link href="/cgv">CGV</Link></nav></div></div></footer>
  </div>;
}
