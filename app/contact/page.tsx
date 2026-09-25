import { OpeningHours } from "@/features/public-site/opening-hours";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPin, Phone, Clock } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { PublicHeader } from "@/components/brand/public-header";
import { PublicMobileBottomNav } from "@/components/brand/public-mobile-bottom-nav";
import { ContactForm } from "@/features/public-site/contact-form";
import s from "@/features/public-site/public-site.module.css";
import v from "./contact.module.css";

export const metadata = {
  title: "Contact & Localisation · Pilates Center Alger",
  description: "Contactez Pilates Center au Centre commercial Zemzem à Bir Mourad Raïs, Alger. Téléphone : 05 53 02 17 14. Horaires, accès et renseignements.",
};

export default function ContactPage() {
  return <div className={s.site}>
    <a href="#contact-contenu" className={s.skip}>Aller au contenu</a>
    <PublicHeader />
    <main id="contact-contenu">
      <section className={`${s.wrap} ${v.intro}`}>
        <nav aria-label="Fil d’Ariane" className={v.breadcrumb}><Link href="/">Accueil</Link><span aria-hidden="true">/</span><span aria-current="page">Contact</span></nav>
        <div className={v.heading}><div><p className={s.eyebrow}>Contact · Bir Mourad Raïs</p><h1>Tout commence<br /><em>par un échange.</em></h1></div><div><p className={v.body}>Une question, une première visite ou l’envie de trouver votre rythme ? L’équipe du studio est à votre écoute.</p><a href="#message" className={s.textLink}>Écrire au studio <ArrowRight size={17}/></a></div></div>
        <div className={v.contactGrid}>
          <a href="tel:0553021714" className={v.info}><Phone size={20}/><span className={v.label}>Un échange direct</span><strong>05 53 02 17 14</strong><span className={v.detail}>Appelez le studio <ArrowUpRight size={16}/></span></a>
          <a href="#venir" className={v.info}><MapPin size={20}/><span className={v.label}>Nous retrouver</span><strong>Bir Mourad Raïs</strong><span className={v.detail}>Centre commercial Zemzem <ArrowRight size={16}/></span></a>
          <Link href="/horaires" className={v.info}><Clock size={20}/><span className={v.label}>Votre rendez-vous</span><strong>Horaires du studio</strong><span className={v.detail}>Consulter les ouvertures <ArrowUpRight size={16}/></span></Link>
        </div>
      </section>

      <section id="message" className={`${s.wrap} ${v.messageGrid}`}>
        <aside className={v.aside}>
          <p className={s.eyebrow}>À votre écoute</p><h2>Un premier pas.<br /><em>À votre rythme.</em></h2><p className={v.body}>Parlez-nous de vos envies ou posez simplement votre question. Nous vous aiderons à préparer votre venue au studio.</p>
          <figure className={v.photo}><Image src="/brand/cours-pilates-alger.webp" alt="Pratique du Pilates sur Reformer en petit groupe" fill sizes="(min-width: 900px) 40vw, 100vw" /><figcaption>Un petit groupe. Une vraie place pour vous.</figcaption></figure>
          <div className={v.booking}><span className={v.label}>Vous avez déjà choisi votre moment ?</span><p>Consultez les places disponibles et réservez directement votre séance.</p><Link href="/reservation" className={s.textLink}>Trouver mon créneau <ArrowUpRight size={17}/></Link></div>
        </aside>
        <ContactForm />
      </section>

      <section id="venir" className={v.visit}><div className={`${s.wrap} ${v.visitGrid}`}><div><p className={s.eyebrow}>Le plaisir de se retrouver</p><h2>Votre prochaine pause.<br /><em>Au cœur d’Alger.</em></h2><p className={v.body}>Retrouvez-nous au Centre commercial Zemzem, à Bir Mourad Raïs. Pour préparer votre première visite ou préciser l’accès, appelez le studio.</p><a href="https://www.google.com/maps/search/?api=1&query=Centre+commercial+Zemzem+Bir+Mourad+Rais+Alger" target="_blank" rel="noopener noreferrer" className={v.mapLink}>Rechercher l’adresse sur Google Maps <ArrowUpRight size={18}/><span className={v.newTab}>Nouvel onglet</span></a></div><div className={v.addressCard}><div className={v.addressTop}><span>PILATES CENTER · ALGER</span><MapPin size={25}/></div><address><strong>Centre commercial<br />Zemzem</strong><span>Bir Mourad Raïs, Alger, Algérie</span></address><div className={v.hours}><OpeningHours /><Link href="/horaires" className={s.textLink}>Consulter les horaires détaillés <ArrowRight size={16}/></Link></div><a href="tel:0553021714" className={v.phone}><Phone size={17}/>05 53 02 17 14 <ArrowUpRight size={18}/></a></div></div></section>

      <section className={`${s.wrap} ${v.member}`}><div><p className={s.eyebrow}>Déjà cliente du studio ?</p><h2>Votre espace.<br /><em>Tout simplement.</em></h2></div><div><p className={v.body}>Réservez ou annulez vos séances, retrouvez votre abonnement et suivez votre solde depuis votre espace personnel.</p><Link href="/connexion" className={s.button}>Accéder à mon espace <ArrowUpRight size={18}/></Link></div></section>
    </main>
    <footer className={s.footer}><div className={s.wrap}><div className={s.footerTop}><Link href="/" aria-label="Pilates Center — Accueil"><BrandLockup light/></Link><p>Force. Équilibre. Harmonie.</p><Link href="/reservation">Votre prochaine séance <ArrowUpRight size={16}/></Link></div><div className={s.footerBottom}><span>© {new Date().getFullYear()} Pilates Center Alger</span><nav aria-label="Informations légales"><Link href="/mentions-legales">Mentions légales</Link><Link href="/politique-de-confidentialite">Confidentialité</Link><Link href="/cgv">CGV</Link></nav></div></div></footer>
    <PublicMobileBottomNav/>
  </div>;
}
