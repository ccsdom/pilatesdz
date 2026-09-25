import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { LoginForm } from "@/features/auth/login-form";
import s from "./login.module.css";

export const metadata = { title: "Connexion · PILATES DZ — Sculptfit center", robots: { index: false, follow: false } };

export default function Page() {
  return <main className={s.page}>
    <section className={s.visual} aria-label="Bienvenue chez Pilates DZ">
      <Image src="/brand/pilates-alger.webp" alt="" fill priority sizes="(min-width: 900px) 46vw, 1px" className={s.photo}/>
      <div className={s.shade}/>
      <Link href="/" className={s.visualLogo} aria-label="PILATES DZ — Accueil"><BrandLockup light/></Link>
      <div className={s.visualCopy}><p className={s.eyebrow}>Votre studio. Votre rythme.</p><h2>Le mouvement<br />vous appartient.</h2><p>Un moment pour vous.<br />Un espace pour retrouver l’équilibre.</p><span>SCULPTFIT CENTER · ALGER</span></div>
    </section>
    <section className={s.content} aria-labelledby="login-title">
      <Link href="/" className={s.back}><ArrowLeft size={16}/> Retour au studio</Link>
      <div className={s.formWrap}>
        <Link href="/" className={s.mobileLogo} aria-label="PILATES DZ — Accueil"><BrandLockup/></Link>
        <p className={s.eyebrow}>Votre espace personnel</p><h1 id="login-title">Heureux de<br /><em>vous retrouver.</em></h1>
        <p className={s.intro}>Connectez-vous pour retrouver vos séances, votre forfait et votre suivi.</p>
        <LoginForm/>
        <div className={s.help}><span>Besoin d’aide pour accéder à votre compte ?</span><Link href="/contact">Contacter le studio <ArrowUpRight size={15}/></Link></div>
      </div>
      <footer className={s.footer}><span>© {new Date().getFullYear()} PILATES DZ</span><Link href="/politique-de-confidentialite">Confidentialité</Link></footer>
    </section>
  </main>;
}
