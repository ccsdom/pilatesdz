import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Plus } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { PublicHeader } from "@/components/brand/public-header";
import { PublicMobileBottomNav } from "@/components/brand/public-mobile-bottom-nav";
import { COURSE_DURATION_MINUTES, COURSE_MAX_CAPACITY, MONTHLY_OFFERS, SINGLE_SESSION_OFFERS, QUARTERLY_DISCOUNT_PERCENT, quarterlyPrice, formatDzd } from "@/domain/models/studio-offers";
import s from "@/features/public-site/public-site.module.css";
import v from "./pricing.module.css";

export const metadata = {
  title: "Tarifs & Abonnements · Pilates Center Alger",
  description: `Découvrez les séances à l’unité et les abonnements Pilates Center Alger. Formules mensuelles et trimestrielles avec ${QUARTERLY_DISCOUNT_PERCENT} % de remise.`,
};

export default function TarifsPage() {
  return <div className={s.site}>
    <a href="#tarifs-contenu" className={s.skip}>Aller au contenu</a>
    <PublicHeader />
    <main id="tarifs-contenu">
      <section className={`${s.wrap} ${v.intro}`}>
        <nav aria-label="Fil d’Ariane" className={v.breadcrumb}><Link href="/">Accueil</Link><span aria-hidden="true">/</span><span aria-current="page">Tarifs</span></nav>
        <div className={v.heading}><div><p className={s.eyebrow}>Tarifs & abonnements</p><h1>Un temps pour soi.<br /><em>Un rythme à choisir.</em></h1></div><div><p className={v.body}>Une première découverte, une séance au gré de vos envies ou un rendez-vous régulier. Trouvez la formule qui fait place au mouvement dans votre quotidien.</p><a href="#abonnements" className={s.textLink}>Explorer les abonnements <ArrowRight size={17}/></a></div></div>
        <div className={v.facts}><span>{COURSE_DURATION_MINUTES} minutes par séance</span><span>{COURSE_MAX_CAPACITY} places maximum</span><span>Paiement en espèces au centre</span></div>
      </section>

      <section className={`${s.wrap} ${v.singleSection}`} aria-labelledby="seances-title">
        <div className={v.sectionTitle}><p className={s.eyebrow}>01 — En toute simplicité</p><h2 id="seances-title">Commencer. <em>Ou revenir.</em></h2></div>
        <div className={v.singles}>{SINGLE_SESSION_OFFERS.map(offer=><article className={v.single} key={offer.id}><div><span className={v.label}>{offer.id === "discovery" ? "Le premier rendez-vous" : "À votre rythme"}</span><h3>{offer.label}</h3><p>{offer.id === "discovery" ? "Un premier pas pour découvrir la pratique et rencontrer le studio." : "Une séance à l’unité, pour retrouver le plaisir du mouvement."}</p></div><div className={v.singlePrice}><strong>{formatDzd(offer.priceDzd)}</strong><span>1 séance · {COURSE_DURATION_MINUTES} minutes</span><Link href="/reservation" className={s.textLink}>{offer.id === "discovery" ? "Découvrir le studio" : "Réserver une séance"} <ArrowUpRight size={17}/></Link></div></article>)}</div>
      </section>

      <section id="abonnements" className={`${s.wrap} ${v.subscriptions}`}>
        <div className={v.sectionHeading}><div><p className={s.eyebrow}>02 — Installer la régularité</p><h2>Votre pratique.<br /><em>Votre rendez-vous.</em></h2></div><p className={v.body}>Deux rythmes pour vous accompagner au fil du mois. Vous choisissez vos créneaux selon les disponibilités du studio.</p></div>
        <div className={v.cards}>{MONTHLY_OFFERS.map((offer,i)=><article key={offer.id} className={`${v.card} ${i === 1 ? v.featured : ""}`}><div className={v.cardTop}><span>FORMULE MENSUELLE</span><span>0{i+1}</span></div><h3>{offer.sessionsPerMonth} séances <span>/ mois</span></h3><p className={v.cardDescription}>{i === 0 ? "Faire du Pilates un rendez-vous régulier." : "Donner plus de place à votre pratique."}</p><div className={v.amount}><strong>{formatDzd(offer.priceDzd)}</strong><span>par mois</span></div><p className={v.unit}>{formatDzd(offer.priceDzd / offer.sessionsPerMonth)} par séance</p><ul><li><Check size={16}/> {offer.sessionsPerMonth} séances de {COURSE_DURATION_MINUTES} minutes par mois</li><li><Check size={16}/> Réservation selon les places disponibles</li><li><Check size={16}/> Suivi du solde dans votre espace cliente</li></ul><Link href="/reservation" className={v.cardButton}>Commencer avec {offer.sessionsPerMonth} séances <ArrowUpRight size={18}/></Link><p className={v.cardNote}>Règlement au centre · Acomptes possibles</p></article>)}</div>
      </section>

      <section className={v.quarterly} aria-labelledby="trimestre-title"><div className={`${s.wrap} ${v.quarterlyGrid}`}><div><p className={s.eyebrow}>03 — Voir un peu plus loin</p><h2 id="trimestre-title">Trois mois pour soi.<br /><em>{QUARTERLY_DISCOUNT_PERCENT} % de moins.</em></h2><p className={v.body}>Retrouvez votre rythme mensuel sur trois mois, avec une remise sur le total de votre formule.</p><p className={v.quarterNote}>Les montants indiqués correspondent au trimestre complet. Paiement en espèces au centre, avec acomptes possibles.</p><Link href="/contact" className={s.textLink}>Préparer mon abonnement <ArrowUpRight size={18}/></Link></div><div className={v.quarterOffers}>{MONTHLY_OFFERS.map(offer=><article key={offer.id}><div className={v.quarterTop}><h3>{offer.sessionsPerMonth} séances <span>/ mois</span></h3><span className={v.discount}>−{QUARTERLY_DISCOUNT_PERCENT} %</span></div><p>{offer.sessionsPerMonth * 3} séances sur 3 mois</p><div className={v.quarterPrice}><strong>{formatDzd(quarterlyPrice(offer.priceDzd))}</strong><span>le trimestre</span></div><div className={v.saving}><span>Au lieu de <s>{formatDzd(offer.priceDzd * 3)}</s></span><span>{formatDzd(offer.priceDzd * 3 - quarterlyPrice(offer.priceDzd))} économisés</span></div></article>)}</div></div></section>

      <section className={`${s.wrap} ${v.guidance}`}><figure className={v.photo}><Image src="/brand/cours-pilates-alger.webp" alt="Séance de Pilates sur Reformer en petit groupe" fill sizes="(min-width: 900px) 40vw, 100vw" /></figure><div><p className={s.eyebrow}>Choisir en toute clarté</p><h2>La bonne formule,<br /><em>c’est la vôtre.</em></h2><p className={v.body}>Vous hésitez entre une découverte et un abonnement ? L’équipe du studio vous aide à choisir selon vos envies et votre disponibilité.</p><div className={v.payment}><h3>Un règlement simple, au centre.</h3><p>Les paiements se font en espèces. Vous pouvez verser un acompte et régler le solde restant selon les modalités convenues avec le centre.</p></div><div className={s.actions}><a href="tel:0553021714" className={s.textLink}>05 53 02 17 14 <ArrowUpRight size={17}/></a><Link href="/connexion" className={s.textLink}>Mon espace cliente <ArrowRight size={17}/></Link></div></div></section>

      <section className={v.questions}><div className={`${s.wrap} ${v.faqGrid}`}><div><p className={s.eyebrow}>Vos questions</p><h2>Avant de<br /><em>faire le premier pas.</em></h2><Link href="/cgv" className={s.textLink}>Consulter les conditions <ArrowUpRight size={17}/></Link></div><div className={v.faq}>{[["Comment bénéficier de la remise trimestrielle ?", `La formule trimestrielle regroupe trois mois d’abonnement et applique une remise de ${QUARTERLY_DISCOUNT_PERCENT} % sur le total mensuel multiplié par trois. Le détail des montants et des séances figure ci-dessus.`], ["Puis-je payer mon abonnement en plusieurs fois ?", "Oui, les acomptes sont possibles. Le paiement se fait en espèces au centre ; convenez avec l’équipe des modalités de règlement du solde."], ["Le site permet-il de payer en ligne ?", "Le site vous permet de réserver votre place. Le règlement s’effectue en espèces directement au centre."], ["Comment suivre mes séances restantes ?", "Connectez-vous à votre espace cliente pour consulter votre forfait, vos crédits et votre historique. Les séances consommées sont déduites de votre solde selon la validation des présences du centre."], ["Mon abonnement garantit-il une place à chaque créneau ?", `Chaque créneau est limité à ${COURSE_MAX_CAPACITY} places. L’abonnement vous donne un nombre de séances ; la réservation reste nécessaire et dépend des places disponibles.`]].map(([question,answer])=><details key={question}><summary>{question}<Plus size={17} aria-hidden="true"/></summary><p>{answer}</p></details>)}</div></div></section>
    </main>
    <footer className={s.footer}><div className={s.wrap}><div className={s.footerTop}><Link href="/" aria-label="Pilates Center — Accueil"><BrandLockup light/></Link><p>Force. Équilibre. Harmonie.</p><Link href="/reservation">Votre prochaine séance <ArrowUpRight size={16}/></Link></div><div className={s.footerBottom}><span>© {new Date().getFullYear()} Pilates Center Alger</span><nav aria-label="Informations légales"><Link href="/mentions-legales">Mentions légales</Link><Link href="/politique-de-confidentialite">Confidentialité</Link><Link href="/cgv">CGV</Link></nav></div></div></footer>
    <PublicMobileBottomNav/>
  </div>;
}
