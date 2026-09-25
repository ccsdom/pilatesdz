import { OpeningHours } from "@/features/public-site/opening-hours";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ArrowRight, MapPin, Phone } from "lucide-react";
import { COURSE_MAX_CAPACITY, COURSE_DURATION_MINUTES, SINGLE_SESSION_OFFERS, formatDzd } from "@/domain/models/studio-offers";
import { BrandLockup, Lotus } from "@/components/brand/brand-lockup";
import { PublicHeader } from "@/components/brand/public-header";
import { PublicMobileBottomNav } from "@/components/brand/public-mobile-bottom-nav";
import s from "@/features/public-site/public-site.module.css";
import v from "./studio.module.css";

export const metadata = {
  title: "Le Studio · Pilates Center Alger",
  description: "Découvrez Pilates Center à Bir Mourad Raïs : Pilates Reformer et au sol, créneaux d’une heure et quatre places maximum. Préparez votre première visite.",
};

export default function LeStudioPage() {
  return <div className={s.site}>
    <a href="#studio-contenu" className={s.skip}>Aller au contenu</a>
    <PublicHeader />
    <main id="studio-contenu">
      <section className={`${s.wrap} ${v.intro}`}>
        <nav aria-label="Fil d’Ariane" className={v.breadcrumb}><Link href="/">Accueil</Link><span aria-hidden="true">/</span><span aria-current="page">Le studio</span></nav>
        <div className={v.introGrid}>
          <div><p className={s.eyebrow}>Le studio · Bir Mourad Raïs</p><h1>Le temps de bouger.<br /><em>L’espace pour soi.</em></h1></div>
          <div className={v.introCopy}><p>Au cœur d’Alger, un lieu pour retrouver le plaisir du mouvement. Le Pilates se pratique ici en petit comité, avec attention et régularité.</p><Link href="/reservation" className={s.textLink}>Préparer ma première séance <ArrowUpRight size={18}/></Link></div>
        </div>
        <figure className={v.panorama}><Image src="/brand/studio-pilates-hero.webp" alt="Pratique du Pilates sur Reformer en petit groupe dans un espace lumineux" fill priority sizes="(max-width: 760px) 1500px, 100vw" /><figcaption><span>PILATES CENTER</span><span>Force · Équilibre · Harmonie</span></figcaption></figure>
        <div className={v.caption}><span>SCULPTFIT CENTER · ALGER</span><a href="#venir">Découvrir le lieu <ArrowRight size={15}/></a></div>
      </section>

      <section className={`${s.wrap} ${v.manifesto}`}>
        <div><p className={s.eyebrow}>01 — Notre philosophie</p><h2>Moins de précipitation.<br /><em>Plus de présence.</em></h2></div>
        <div><p className={v.lead}>Une séance ne se résume pas à une suite d’exercices. C’est un moment pour porter attention à sa posture, à sa respiration et à ses sensations.</p><p className={s.body}>Notre studio vous accueille au Centre commercial Zemzem, à Bir Mourad Raïs. Que vous découvriez la méthode ou souhaitiez pratiquer régulièrement, trouvez le rythme qui vous correspond.</p></div>
      </section>

      <section className={v.experience}><div className={s.wrap}>
        <div className={v.experienceGrid}>
          <div className={v.experienceCopy}><Lotus className="h-12 w-16"/><p className={s.eyebrow}>02 — La pratique, à taille humaine</p><h2>Un petit groupe.<br /><em>Une vraie place pour vous.</em></h2><p>Des créneaux de {COURSE_DURATION_MINUTES} minutes, limités à {COURSE_MAX_CAPACITY} personnes. Vous choisissez votre heure selon les places disponibles et les plages dédiées du studio.</p><Link href="/les-cours" className={s.textLink}>Découvrir nos pratiques <ArrowUpRight size={18}/></Link></div>
          <figure className={v.groupPhoto}><Image src="/brand/cours-pilates-alger.webp" alt="Trois personnes pratiquent le Pilates avec les sangles du Reformer" fill sizes="(min-width: 900px) 50vw, 100vw" /></figure>
        </div>
        <div className={v.numbers}>{[[String(COURSE_MAX_CAPACITY), "places maximum", "Un cadre intime pour chaque séance."], [String(COURSE_DURATION_MINUTES), "minutes par créneau", "Un rendez-vous qui trouve sa place dans votre journée."], ["Vous", "au centre de notre attention", "Des plages dédiées, sur réservation."]].map(([n,title,copy])=><article key={title}><strong>{n}</strong><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </div></section>

      <section className={`${s.wrap} ${v.method}`}>
        <figure className={v.portrait}><Image src="/brand/pilates-alger.webp" alt="Travail du mouvement et des sangles sur un appareil Reformer" fill sizes="(min-width: 900px) 40vw, 100vw" /></figure>
        <div><p className={s.eyebrow}>03 — Le sens du détail</p><h2>Le mouvement précis.<br /><em>La progression à votre rythme.</em></h2><div className={v.methodRows}>{[["Le Reformer", "Un appareil à ressorts et à sangles pour explorer la résistance, le contrôle et la fluidité du mouvement."], ["Le Pilates au sol", "Une pratique centrée sur la respiration, la posture et la maîtrise du geste."], ["Votre suivi personnel", "Retrouvez vos réservations, vos forfaits, votre historique et vos mensurations dans votre espace cliente."]].map(([title,copy],i)=><article key={title}><span>0{i+1}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div><Link href="/connexion" className={s.textLink}>Accéder à mon espace <ArrowRight size={17}/></Link></div>
      </section>

      <section id="venir" className={v.visit}><div className={`${s.wrap} ${v.visitGrid}`}>
        <div><p className={s.eyebrow}>04 — Votre première visite</p><h2>On se retrouve<br /><em>au studio.</em></h2><p className={s.body}>Une question avant de commencer ? Appelez-nous pour préparer votre venue, ou choisissez directement un créneau disponible.</p><div className={s.actions}><Link href="/reservation" className={s.button}>Réserver ma séance <ArrowUpRight size={18}/></Link><Link href="/tarifs" className={s.textLink}>Voir les formules <ArrowRight size={16}/></Link></div><p className={v.discovery}>Séance découverte · {formatDzd(SINGLE_SESSION_OFFERS[0].priceDzd)}</p></div>
        <div className={v.address}><div><MapPin size={20}/><div><h3>Bir Mourad Raïs, Alger</h3><p>Centre commercial Zemzem</p><Link href="/contact" className={s.textLink}>Coordonnées et accès <ArrowUpRight size={16}/></Link></div></div><div><span className={v.small}>HORAIRES</span><OpeningHours /><Link href="/horaires" className={s.textLink}>Consulter les horaires <ArrowRight size={16}/></Link></div><a href="tel:0553021714" className={v.phone}><Phone size={18}/>05 53 02 17 14<ArrowUpRight size={18}/></a></div>
      </div></section>
    </main>
    <footer className={s.footer}><div className={s.wrap}><div className={s.footerTop}><Link href="/" aria-label="Pilates Center — Accueil"><BrandLockup light/></Link><p>Force. Équilibre. Harmonie.</p><Link href="/reservation">Votre prochaine séance <ArrowUpRight size={16}/></Link></div><div className={s.footerBottom}><span>© {new Date().getFullYear()} Pilates Center Alger</span><nav aria-label="Informations légales"><Link href="/mentions-legales">Mentions légales</Link><Link href="/politique-de-confidentialite">Confidentialité</Link><Link href="/cgv">CGV</Link></nav></div></div></footer>
    <PublicMobileBottomNav/>
  </div>;
}
