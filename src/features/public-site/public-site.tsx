import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ArrowRight, Plus, MapPin, Phone } from "lucide-react";
import { COURSE_DURATION_MINUTES, COURSE_MAX_CAPACITY, SINGLE_SESSION_OFFERS, MONTHLY_OFFERS, QUARTERLY_DISCOUNT_PERCENT, formatDzd } from "@/domain/models/studio-offers";
import { BrandLockup, Lotus } from "@/components/brand/brand-lockup";
import { PublicHeader } from "@/components/brand/public-header";
import { PublicMobileBottomNav } from "@/components/brand/public-mobile-bottom-nav";
import s from "./public-site.module.css";

const questions = [
  ["Comment réserver ma première séance ?", "Choisissez un créneau disponible dans la réservation en ligne et renseignez vos coordonnées. Chaque créneau dure une heure et accueille quatre personnes maximum."],
  ["Je suis déjà cliente, comment réserver ?", "Connectez-vous à votre espace personnel pour réserver, annuler une réservation et consulter vos forfaits, votre historique et vos mensurations."],
  ["Faut-il avoir déjà pratiqué le Pilates ?", "Vous pouvez commencer par une séance découverte. Contactez le studio pour échanger sur votre niveau et préparer votre première visite."],
  ["Comment régler mon abonnement ?", "Les règlements s’effectuent au centre, en espèces. Les acomptes sont possibles, avec un suivi du solde restant. Le paiement trimestriel bénéficie d’une remise de 20 %."],
];

export function PublicSite() {
  return <div className={s.site}>
    <a href="#contenu" className={s.skip}>Aller au contenu</a>
    <PublicHeader />
    <main id="contenu">
      <section className={s.heroBackground} aria-labelledby="home-title">
        <Image src="/brand/studio-pilates-hero.webp" alt="" fill priority sizes="(max-width: 1900px) 1900px, 100vw" className={s.heroBackdrop} />
        <div className={`${s.wrap} ${s.hero}`}>
        <div className={s.heroCopy}>
          <p className={s.eyebrow}><span />Pilates & Reformer · Alger</p>
          <h1 id="home-title">La force dans<br /><em>l’équilibre.</em></h1>
          <p className={s.intro}>Une heure pour vous.<br />Un mouvement vers l’essentiel.</p>
          <p className={s.body}>À Bir Mourad Raïs, découvrez le Pilates dans un cadre intime, à quatre personnes maximum. Prenez le temps de bouger, de respirer, de vous retrouver.</p>
          <div className={s.actions}><Link className={s.button} href="/reservation">Réserver ma séance <ArrowUpRight size={18} /></Link><Link className={s.textLink} href="/le-studio">Découvrir le studio <ArrowRight size={16} /></Link></div>
          <div className={s.discovery}><span>Votre première rencontre avec le Pilates</span><strong>Séance découverte · {formatDzd(SINGLE_SESSION_OFFERS[0].priceDzd)}</strong></div>
        </div>
        </div>
      </section>
      <div className={s.facts}><div className={s.wrap}>{[[String(COURSE_MAX_CAPACITY), "places par créneau"], [String(COURSE_DURATION_MINUTES), "minutes pour vous"], ["10h — 20h", "du samedi au jeudi"]].map(([value,label])=><div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></div>

      <section id="studio" className={`${s.wrap} ${s.story}`}>
        <figure className={s.photo}><Image src="/brand/cours-pilates-alger.webp" alt="Séance de Pilates en petit groupe sur Reformer, avec travail des sangles" fill sizes="(min-width: 900px) 45vw, 100vw" /><figcaption>LE PILATES · UNE ATTENTION AU MOUVEMENT</figcaption></figure>
        <div className={s.storyCopy}><p className={s.eyebrow}>01 — L’esprit du lieu</p><h2>Un espace à part.<br /><em>Votre temps à vous.</em></h2><p className={s.body}>Laissez le rythme de la ville à la porte. Ici, le mouvement se travaille avec attention, dans un studio à taille humaine au cœur de Bir Mourad Raïs.</p><div className={s.principles}>{[["01", "La précision", "Porter attention à chaque geste, à la posture et à la respiration."], ["02", "La régularité", "Trouver votre rythme et faire de votre séance un rendez-vous avec vous-même."], ["03", "La proximité", "Quatre places par heure pour pratiquer dans un cadre intime."]].map(([n,title,copy])=><div key={n}><span>{n}</span><div><h3>{title}</h3><p>{copy}</p></div></div>)}</div><Link href="/le-studio" className={s.textLink}>Entrer dans l’univers du studio <ArrowUpRight size={17}/></Link></div>
      </section>

      <section id="pratiques" className={s.dark}><div className={s.wrap}><div className={s.practiceGrid}><div className={s.practiceAside}><div className={s.sectionHead}><div><p className={s.eyebrow}>02 — La pratique</p><h2>Ressentir le mouvement.<br /><em>Trouver son équilibre.</em></h2></div><Link href="/les-cours" className={s.textLink}>Explorer les pratiques <ArrowUpRight size={18}/></Link></div><Lotus className="h-16 w-20"/><span className={s.eyebrow}>Respirer. Bouger. Recommencer.</span><h3>Le corps en mouvement,<br /><em>l’esprit au présent.</em></h3><p>Au sol ou sur Reformer, découvrez une pratique qui donne toute sa place à la précision et à la maîtrise du geste.</p><Link href="/pratiques#sol" className={s.textLink}>Découvrir le Pilates au sol <ArrowRight size={17}/></Link></div><Link href="/pratiques#reformer" className={s.practicePhoto}><Image src="/brand/pilates-alger.webp" alt="Exercice de Pilates sur Reformer, jambes levées avec les sangles" fill sizes="(min-width: 900px) 45vw, 100vw" /><div><span>RÉSISTANCE & FLUIDITÉ</span><h3>Le Reformer</h3><ArrowUpRight size={28}/></div></Link></div></div></section>

      <section className={`${s.wrap} ${s.booking}`}><div><p className={s.eyebrow}>03 — Votre rendez-vous</p><h2>Votre séance.<br /><em>À votre rythme.</em></h2><p className={s.body}>Choisissez votre heure parmi les places disponibles. Déjà cliente ? Retrouvez vos réservations et le suivi de votre abonnement dans votre espace personnel.</p><div className={s.actions}><Link href="/reservation" className={s.button}>Voir les disponibilités <ArrowUpRight size={18}/></Link><Link href="/connexion" className={s.textLink}>Mon espace <ArrowRight size={16}/></Link></div></div><div id="horaires" className={s.schedule}><p className={s.eyebrow}>Les horaires du studio</p><h3>Du samedi au jeudi<br /><em>10h00 — 20h00</em></h3><div><strong>Samedi · Lundi · Mercredi</strong><p>Femmes : 10h–14h <span>Hommes : 14h–20h</span></p></div><div><strong>Dimanche · Mardi · Jeudi</strong><p>Femmes : 10h–18h <span>Hommes : 18h–20h</span></p></div><p className={s.scheduleNote}>Fermé le vendredi · Créneaux de {COURSE_DURATION_MINUTES} minutes</p></div></section>

      <section id="tarifs" className={s.pricing}><div className={s.wrap}><div className={s.sectionHead}><div><p className={s.eyebrow}>04 — Les formules</p><h2>Un premier pas.<br /><em>Ou un nouveau rituel.</em></h2></div><p>Des tarifs en toute clarté.<br />À la séance, au mois ou au trimestre.</p></div><div className={s.priceGrid}><article><span className={s.eyebrow}>Pour découvrir</span><h3>Séance découverte</h3><p className={s.price}>{formatDzd(SINGLE_SESSION_OFFERS[0].priceDzd)}<small>la séance</small></p><p>Une première séance de {COURSE_DURATION_MINUTES} minutes pour découvrir la pratique.</p><Link href="/reservation" className={s.textLink}>Faire le premier pas <ArrowUpRight size={18}/></Link></article>{MONTHLY_OFFERS.map(offer=><article key={offer.id}><span className={s.eyebrow}>Pour pratiquer régulièrement</span><h3>{offer.sessionsPerMonth} séances par mois</h3><p className={s.price}>{formatDzd(offer.priceDzd)}<small>par mois</small></p><p>Vos séances, à réserver selon les disponibilités du studio.</p><Link href="/tarifs" className={s.textLink}>Découvrir la formule <ArrowUpRight size={18}/></Link></article>)}</div><div className={s.priceFoot}><p>−{QUARTERLY_DISCOUNT_PERCENT} % avec le paiement trimestriel · Paiement en espèces, acomptes possibles.</p><Link href="/tarifs" className={s.textLink}>Tous les tarifs <ArrowRight size={16}/></Link></div></div></section>

      <section className={`${s.wrap} ${s.faq}`}><div><p className={s.eyebrow}>Avant de venir</p><h2>Quelques réponses,<br /><em>tout simplement.</em></h2></div><div>{questions.map(([q,a])=><details key={q}><summary>{q}<Plus size={18}/></summary><p>{a}</p></details>)}</div></section>
      <section id="contact" className={s.visit}><div className={s.wrap}><Lotus className="h-12 w-16"/><p className={s.eyebrow}>Pilates Center · Bir Mourad Raïs</p><h2>Votre prochaine heure<br /><em>commence ici.</em></h2><Link href="/reservation" className={s.button}>Réserver ma séance <ArrowUpRight size={18}/></Link><div className={s.visitInfo}><span><MapPin size={16}/>Centre commercial Zemzem, Alger</span><a href="tel:0553021714"><Phone size={16}/>05 53 02 17 14</a></div></div></section>
    </main>
    <footer className={s.footer}><div className={s.wrap}><div className={s.footerTop}><Link href="/" aria-label="Pilates Center — Accueil"><BrandLockup light/></Link><p>Force. Équilibre. Harmonie.</p><Link href="/contact">Contacter le studio <ArrowUpRight size={16}/></Link></div><div className={s.footerBottom}><span>© {new Date().getFullYear()} Pilates Center Alger</span><nav aria-label="Informations légales"><Link href="/mentions-legales">Mentions légales</Link><Link href="/politique-de-confidentialite">Confidentialité</Link><Link href="/cgv">CGV</Link></nav></div></div></footer>
    <PublicMobileBottomNav/>
  </div>;
}
