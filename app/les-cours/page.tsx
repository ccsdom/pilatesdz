import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { BrandLockup, Lotus } from "@/components/brand/brand-lockup";
import { PublicHeader } from "@/components/brand/public-header";
import { PublicMobileBottomNav } from "@/components/brand/public-mobile-bottom-nav";
import { COURSE_DURATION_MINUTES, COURSE_MAX_CAPACITY, SINGLE_SESSION_OFFERS, formatDzd } from "@/domain/models/studio-offers";
import s from "@/features/public-site/public-site.module.css";
import v from "./practices.module.css";

export const metadata = {
  title: "La pratique · Pilates Reformer & Sol · Pilates Center Alger",
  description: "Explorez le Pilates Reformer et au sol à Bir Mourad Raïs. Des séances de 60 minutes, quatre places maximum et une pratique à votre rythme.",
};

export default function LesCoursPage() {
  return <div className={s.site}>
    <a href="#pratique-contenu" className={s.skip}>Aller au contenu</a>
    <PublicHeader />
    <main id="pratique-contenu">
      <section className={`${s.wrap} ${v.intro}`}>
        <nav aria-label="Fil d’Ariane" className={v.breadcrumb}><Link href="/">Accueil</Link><span aria-hidden="true">/</span><span aria-current="page">La pratique</span></nav>
        <div className={v.hero}>
          <div className={v.heroCopy}>
            <p className={s.eyebrow}>La méthode Pilates · Alger</p>
            <h1>La force du geste.<br /><em>La liberté<br />du mouvement.</em></h1>
            <p className={v.description}>Sur Reformer ou sur tapis, prenez le temps de ressentir, de respirer et d’explorer votre équilibre. Une pratique attentive, à votre rythme.</p>
            <Link href="/reservation" className={s.button}>Trouver mon créneau <ArrowUpRight size={18}/></Link>
            <div className={v.heroNote}><span>{COURSE_DURATION_MINUTES} minutes pour vous</span><span>{COURSE_MAX_CAPACITY} places maximum</span></div>
          </div>
          <figure className={v.heroPhoto}>
            <Image src="/brand/cours-pilates-alger.webp" alt="Pratique en petit groupe avec les sangles du Reformer" fill priority sizes="(min-width: 900px) 55vw, 100vw" />
            <figcaption><span>CONTRÔLE · RESPIRATION · FLUIDITÉ</span><span>01 / LA PRATIQUE</span></figcaption>
          </figure>
        </div>
        <nav aria-label="Explorer les pratiques" className={v.chapterNav}>
          <a href="#reformer"><span>01</span> Le Reformer <ArrowDown size={16}/></a>
          <a href="#sol"><span>02</span> Le Pilates au sol <ArrowDown size={16}/></a>
          <a href="#commencer"><span>03</span> Commencer <ArrowDown size={16}/></a>
        </nav>
      </section>

      <section id="reformer" className={`${s.wrap} ${v.reformer}`}>
        <figure className={v.portrait}><Image src="/brand/pilates-alger.webp" alt="Mouvement sur Reformer avec les jambes soutenues par les sangles" fill sizes="(min-width: 900px) 40vw, 100vw" /><figcaption>La résistance au service du mouvement.</figcaption></figure>
        <div className={v.practiceCopy}><p className={s.eyebrow}>01 — Pilates Reformer</p><h2>De la résistance.<br /><em>Naît la fluidité.</em></h2><p className={v.description}>Un chariot mobile, des ressorts et des sangles. Le Reformer invite à explorer chaque mouvement avec précision, en jouant sur la résistance et le contrôle.</p>
          <div className={v.rows}>{[["Résistance modulable", "Les ressorts permettent de varier le travail selon l’exercice et votre progression."], ["Précision du geste", "Une attention portée au placement, à la coordination et à la maîtrise du mouvement."], ["Un rythme qui vous ressemble", "Découvrir les bases, affiner ses sensations, puis avancer séance après séance."]].map(([title,copy],i)=><article key={title}><span>0{i+1}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div>
          <Link href="/reservation" className={s.textLink}>Découvrir les disponibilités <ArrowUpRight size={18}/></Link>
        </div>
      </section>

      <section id="sol" className={v.matwork}><div className={`${s.wrap} ${v.matworkGrid}`}>
        <div><p className={s.eyebrow}>02 — Pilates au sol</p><h2>Revenir à l’essentiel.<br /><em>Partir de soi.</em></h2><p className={v.description}>Sur tapis, le poids du corps devient le point de départ. La respiration accompagne le geste, le centre guide le mouvement et chaque enchaînement invite à une présence plus attentive.</p><p className={v.description}>Une autre façon d’explorer la méthode Pilates, avec simplicité et concentration.</p><Link href="/contact" className={s.textLink}>Me renseigner sur la pratique au sol <ArrowUpRight size={18}/></Link></div>
        <div className={v.principles}><div className={v.principlesTop}><span>LES FONDAMENTAUX</span><Lotus className="h-10 w-14"/></div>{[["Respirer", "Donner un rythme au mouvement."], ["Se centrer", "Porter son attention sur le placement."], ["Contrôler", "Privilégier la qualité de chaque geste."]].map(([title,copy],i)=><div className={v.principle} key={title}><span>0{i+1}</span><div><h3>{title}</h3><p>{copy}</p></div></div>)}<p className={v.signature}>Moins de précipitation. Plus de sensations.</p></div>
      </div></section>

      <section id="commencer" className={`${s.wrap} ${v.start}`}>
        <div className={v.sectionHeading}><div><p className={s.eyebrow}>03 — Votre rendez-vous avec vous</p><h2>Votre heure.<br /><em>Votre place.</em></h2></div><p className={v.description}>Pas besoin d’attendre le début d’un programme. Choisissez un créneau disponible pendant les horaires d’ouverture du studio.</p></div>
        <div className={v.steps}>{[["Choisir son créneau", `Une séance de ${COURSE_DURATION_MINUTES} minutes, avec ${COURSE_MAX_CAPACITY} places maximum. Consultez les disponibilités et les plages du studio.`], ["Réserver sa place", "Vous venez pour la première fois ? Commencez sur le site. Déjà cliente ? Connectez-vous à votre espace pour réserver."], ["Garder le fil", "Retrouvez vos prochaines séances, votre abonnement et votre historique dans un espace personnel simple à consulter."]].map(([title,copy],i)=><article key={title}><span className={v.stepNumber}>0{i+1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
        <div className={v.discovery}><div><p className={s.eyebrow}>Le premier pas</p><h3>Une séance pour découvrir.</h3><p>Prenez le temps de rencontrer la pratique et le studio.</p></div><div className={v.price}><strong>{formatDzd(SINGLE_SESSION_OFFERS[0].priceDzd)}</strong><span>Séance découverte</span></div><Link href="/reservation" className={s.button}>Réserver ma séance <ArrowUpRight size={18}/></Link></div>
        <div className={v.moreLinks}><Link href="/tarifs">Explorer les forfaits <ArrowRight size={16}/></Link><Link href="/horaires">Consulter les horaires <ArrowRight size={16}/></Link></div>
      </section>

      <section className={v.questions}><div className={`${s.wrap} ${v.questionsGrid}`}><div><p className={s.eyebrow}>Avant de commencer</p><h2>Les petits détails.<br /><em>Pour venir sereinement.</em></h2><p className={v.description}>Un besoin particulier ou une envie de séance privée ? Échangeons pour préparer votre venue.</p><a href="tel:0553021714" className={s.textLink}>05 53 02 17 14 <ArrowUpRight size={18}/></a></div><div className={v.faq}>{[["Je débute, par où commencer ?", "La séance découverte est un premier rendez-vous avec le studio. Indiquez à l’équipe que vous débutez pour faire le point sur votre expérience et vos attentes."], ["Reformer ou Pilates au sol ?", "Le Reformer utilise un appareil à ressorts et à sangles. Au sol, la pratique s’appuie sur le tapis et le poids du corps. Contactez le studio pour choisir la pratique et connaître ses disponibilités."], ["Comment gérer mes réservations ?", "Si vous êtes déjà cliente, connectez-vous à votre espace personnel. Vous pouvez y retrouver vos séances, réserver et annuler selon les conditions du studio."], ["Puis-je demander un accompagnement privé ?", "Contactez directement le studio pour discuter de votre demande et vérifier les possibilités, les disponibilités et les tarifs avant de réserver."]].map(([q,a])=><details key={q}><summary>{q}<Plus size={17} aria-hidden="true"/></summary><p>{a}</p></details>)}</div></div></section>
    </main>
    <footer className={s.footer}><div className={s.wrap}><div className={s.footerTop}><Link href="/" aria-label="Pilates Center — Accueil"><BrandLockup light/></Link><p>Force. Équilibre. Harmonie.</p><Link href="/reservation">Votre prochaine séance <ArrowUpRight size={16}/></Link></div><div className={s.footerBottom}><span>© {new Date().getFullYear()} Pilates Center Alger</span><nav aria-label="Informations légales"><Link href="/mentions-legales">Mentions légales</Link><Link href="/politique-de-confidentialite">Confidentialité</Link><Link href="/cgv">CGV</Link></nav></div></div></footer>
    <PublicMobileBottomNav/>
  </div>;
}
