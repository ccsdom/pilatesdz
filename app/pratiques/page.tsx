import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Check, Users, Award, ShieldCheck, Clock, Phone, Heart, Menu, ChevronRight } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { COURSE_DURATION_MINUTES, COURSE_MAX_CAPACITY } from "@/domain/models/studio-offers";

export const metadata = {
  title: "Nos Pratiques · Pilates Reformer & Sol · Pilates Center Alger",
  description: "Découvrez nos 4 disciplines Pilates au studio de Bir Mourad Raïs : Reformer, Pilates au sol, Cours collectifs en petit comité et Coaching individuel.",
};

export default function NosPratiquesPage() {
  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#1c1917] font-sans antialiased selection:bg-[#b7893b] selection:text-white overflow-x-hidden">
      
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-radial from-[#e8d5b7]/40 via-[#f3e6d3]/20 to-transparent blur-3xl" />
        <div className="absolute top-[40%] -right-40 h-[600px] w-[600px] rounded-full bg-radial from-[#d4af37]/15 via-transparent to-transparent blur-3xl" />
        <div className="absolute top-[70%] -left-40 h-[600px] w-[600px] rounded-full bg-radial from-[#c5a059]/15 via-transparent to-transparent blur-3xl" />
      </div>

      {/* Header Glassmorphism - IDENTIQUE À L'ACCUEIL */}
      <header className="sticky top-0 z-50 border-b border-[#e7dac8]/60 bg-[#faf7f2]/85 backdrop-blur-xl transition-all duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <BrandLockup compact />
          
          <nav className="hidden items-center gap-9 text-xs font-medium uppercase tracking-[0.2em] text-[#524b42] lg:flex">
            <Link href="/" className="transition-colors hover:text-[#99702d]">Le Studio</Link>
            <Link href="/pratiques" className="text-[#99702d] font-semibold">Nos Pratiques</Link>
            <Link href="/#horaires" className="transition-colors hover:text-[#99702d]">Horaires</Link>
            <Link href="/#tarifs" className="transition-colors hover:text-[#99702d]">Tarifs</Link>
            <Link href="/#contact" className="transition-colors hover:text-[#99702d]">Contact</Link>
          </nav>

          <div className="flex items-center gap-3">
            <a 
              href="tel:0553021714" 
              className="hidden items-center gap-2 rounded-full border border-[#cdae72]/50 px-4 py-2 text-xs font-semibold tracking-wider text-[#38322a] transition-all hover:bg-[#f3e6d3] sm:inline-flex"
            >
              <Phone className="h-3.5 w-3.5 text-[#99702d]" />
              <span>05 53 02 17 14</span>
            </a>
            <Link 
              href="/reservation" 
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[#1c1917] px-6 py-2.5 text-xs font-semibold tracking-wider text-white shadow-md transition-all duration-300 hover:bg-[#b7893b] hover:text-black hover:shadow-xl hover:shadow-[#b7893b]/20"
            >
              <span>Réserver</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
            <button className="p-2 text-[#1c1917] lg:hidden" aria-label="Ouvrir le menu">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        
        {/* HERO HEADER REFINED */}
        <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-16 lg:px-10 lg:pt-24 lg:pb-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#b7893b]/30 bg-[#b7893b]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#9a712e]">
              <Sparkles className="h-3.5 w-3.5" /> Méthode & Disciplines du Studio
            </div>
            
            <h1 className="mt-8 font-serif text-[clamp(2.8rem,5.5vw,5.2rem)] font-light leading-[0.98] tracking-tight text-[#1c1917]">
              L’art du mouvement <br />
              <span className="relative inline-block font-serif italic text-[#b7893b]">
                conscient & précis.
                <svg className="absolute -bottom-2 left-0 w-full text-[#cdae72]/40" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 10C50 3 150 3 198 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>
            
            <p className="mt-8 text-lg leading-relaxed text-[#61574b] lg:text-xl">
              Quatre approches complémentaires pensées pour sculpter votre silhouette, redresser votre posture et vous offrir une profonde sensation de bien-être physique et mental.
            </p>
          </div>
        </section>

        {/* PRATIQUE 1 : PILATES REFORMER */}
        <section id="reformer" className="py-20 bg-white border-y border-[#e5dacf]">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-12 items-center">
              
              <div className="lg:col-span-6 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[#b7893b]/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#7e581b]">
                    01 · Star du Studio
                  </span>
                  <span className="text-xs text-[#8c8275]">{COURSE_DURATION_MINUTES} min · {COURSE_MAX_CAPACITY} places max</span>
                </div>

                <h2 className="font-serif text-3xl font-light text-[#1c1917] sm:text-4xl">
                  Pilates Reformer
                </h2>

                <p className="text-base leading-relaxed text-[#61574b]">
                  Le Pilates Reformer s'effectue sur un appareil composé d'un chariot coulissant, de ressorts de résistance progressive, de sangles et de poulies. Cette machine offre un soutien fluide tout en augmentant l'intensité du travail musculaire.
                </p>

                <div className="rounded-2xl border border-[#cdae72]/40 bg-[#faf7f2] p-6 space-y-3">
                  <h3 className="font-serif text-lg text-[#1c1917]">Bénéfices clés du Reformer :</h3>
                  <ul className="space-y-2.5 text-sm text-[#595146]">
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-[#8b652b] shrink-0" />
                      <span>Allongement musculaire et tonification profonde sans impact articulaire.</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-[#8b652b] shrink-0" />
                      <span>Correction précise de l’alignement de la colonne vertébrale et du bassin.</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-[#8b652b] shrink-0" />
                      <span>Résistance adaptable à tous les niveaux (débutant à avancé).</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-2 flex flex-wrap gap-4">
                  <Link
                    href="/espace-cliente"
                    className="group inline-flex items-center gap-3 rounded-full bg-[#b7893b] px-7 py-3.5 text-sm font-semibold text-black shadow-md transition-all duration-300 hover:bg-[#d7b66f]"
                  >
                    <span>Réserver un cours Reformer</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6 flex items-center justify-center">
                <div className="relative h-[440px] w-full max-w-[560px] overflow-hidden rounded-3xl border border-[#cdae72]/40 bg-gradient-to-b from-[#faf7f2] to-[#f4efe6] p-6 shadow-xl flex items-center justify-center">
                  <Image
                    src="/brand/reformer-hero-poster-illustration.png"
                    alt="Pilates Reformer au studio Pilates Center"
                    width={800}
                    height={700}
                    priority
                    className="h-auto max-h-[380px] w-full object-contain drop-shadow-md transition-transform duration-700 hover:scale-[1.03]"
                  />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* PRATIQUE 2 : PILATES AU SOL (MATWORK) */}
        <section id="sol" className="py-20 bg-[#faf7f2]">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-12 items-center">
              
              <div className="lg:col-span-6 lg:order-2 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[#f4efe6] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#8b652b]">
                    02 · Tapis & Accessoires
                  </span>
                  <span className="text-xs text-[#8c8275]">{COURSE_DURATION_MINUTES} min · {COURSE_MAX_CAPACITY} places max</span>
                </div>

                <h2 className="font-serif text-3xl font-light text-[#1c1917] sm:text-4xl">
                  Pilates au Sol (Matwork)
                </h2>

                <p className="text-base leading-relaxed text-[#61574b]">
                  La pratique originelle sur tapis utilise la pesanteur et le poids du corps pour renforcer la ceinture abdominale, le dos et les fessiers. Des accessoires ciblés (soft balls, anneaux Pilates, élastiques) enrichissent chaque session.
                </p>

                <div className="rounded-2xl border border-[#e5dacf] bg-white p-6 space-y-3 shadow-sm">
                  <h3 className="font-serif text-lg text-[#1c1917]">Bénéfices clés du Pilates au sol :</h3>
                  <ul className="space-y-2.5 text-sm text-[#595146]">
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-[#8b652b] shrink-0" />
                      <span>Renforcement intense du transverse et du plancher pelvien.</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-[#8b652b] shrink-0" />
                      <span>Amélioration nette de la souplesse et du contrôle respiratoire.</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-[#8b652b] shrink-0" />
                      <span>Apprentissage de postures fondamentales transférables au quotidien.</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-2">
                  <Link
                    href="/espace-cliente"
                    className="inline-flex items-center gap-2 rounded-full border border-[#b7893b] px-7 py-3.5 text-sm font-semibold text-[#1c1917] transition-all hover:bg-[#1c1917] hover:text-white"
                  >
                    <span>Réserver un cours au sol</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6 lg:order-1">
                <div className="relative h-[440px] w-full overflow-hidden rounded-3xl border border-[#e5dacf] bg-white p-10 shadow-lg flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#99702d]">
                    <span>PILATES MATWORK</span>
                    <span>FORCE & FLEXIBILITÉ</span>
                  </div>

                  <div className="space-y-4 my-auto text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#b7893b]/15 text-[#99702d]">
                      <Heart className="h-8 w-8" />
                    </div>
                    <h3 className="font-serif text-3xl font-light text-[#1c1917]">Maîtrise du Centrage</h3>
                    <p className="text-sm leading-relaxed text-[#676056] max-w-md mx-auto">
                      "Un corps libre de tensions et de fatigue permet d'affronter les exigences de la vie avec enthousiasme."
                    </p>
                  </div>

                  <div className="text-center text-xs text-[#8c8275] border-t border-[#f0e8dd] pt-4">
                    Studio Bir Mourad Raïs · Matériel fourni
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* PRATIQUE 3 & 4 : COLLECTIFS & INDIVIDUELS (LUXURY DARK SECTION) */}
        <section className="py-24 bg-[#141210] text-white relative overflow-hidden">
          <div className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-[#b7893b]/10 blur-[140px]" />
          
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c79b4d]">Format des Cours</span>
              <h2 className="mt-4 font-serif text-4xl font-light sm:text-5xl">En petit comité ou sur-mesure.</h2>
              <p className="mt-4 text-sm text-white/60">Sélectionnez la formule la plus adaptée à vos objectifs et votre rythme.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              
              {/* Collectifs */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md flex flex-col justify-between shadow-2xl transition-all hover:border-[#b7893b]/40">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-[#c79b4d]">
                    <span>03 · PETIT COMITÉ</span>
                    <span>MAX 4 A 6 PERSONNES</span>
                  </div>
                  <h3 className="mt-6 font-serif text-3xl font-light text-white">Cours Collectifs</h3>
                  <p className="mt-4 text-sm leading-relaxed text-white/65">
                    L'énergie motivante du groupe combinée à l'exigence d'un suivi personnalisé. Nos effectifs réduits permettent à la coach de corriger chaque placement et d'adapter les variantes à chaque participante.
                  </p>

                  <ul className="mt-6 space-y-3 text-sm text-white/85">
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-[#c79b4d]" /> Ambiance conviviale et motivante
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-[#c79b4d]" /> Corrections posturales individuelles constantes
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-[#c79b4d]" /> Créneaux réguliers du Samedi au Jeudi
                    </li>
                  </ul>
                </div>

                <div className="mt-10 pt-6 border-t border-white/10">
                  <Link
                    href="/espace-cliente"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#b7893b] py-3.5 text-sm font-semibold text-black hover:bg-[#d7b66f] transition-all"
                  >
                    <span>Voir le planning des cours</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Individuels */}
              <div className="rounded-3xl border border-[#c79b4d]/40 bg-gradient-to-b from-white/10 to-white/5 p-8 backdrop-blur-md flex flex-col justify-between shadow-2xl transition-all hover:border-[#c79b4d]">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-[#c79b4d]">
                    <span>04 · SUR-MESURE</span>
                    <span>COACHING PRIVÉ 1-ON-1</span>
                  </div>
                  <h3 className="mt-6 font-serif text-3xl font-light text-white">Cours Individuels</h3>
                  <p className="mt-4 text-sm leading-relaxed text-white/65">
                    Une prise en charge exclusive 1-on-1 conçue spécifiquement selon vos besoins anatomiques (post-partum, rééducation, douleurs dorsales chroniques ou objectif athlétique précis).
                  </p>

                  <ul className="mt-6 space-y-3 text-sm text-white/85">
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-[#c79b4d]" /> Bilan postural préalable approfondi
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-[#c79b4d]" /> Programme sur-mesure ajusté séance par séance
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-[#c79b4d]" /> Créneau horaire privatisé sur demande
                    </li>
                  </ul>
                </div>

                <div className="mt-10 pt-6 border-t border-white/10">
                  <a
                    href="tel:0553021714"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#c79b4d] py-3.5 text-sm font-semibold text-[#e5be78] hover:bg-[#c79b4d] hover:text-black transition-all"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Réserver un coaching privé : 05 53 02 17 14</span>
                  </a>
                </div>
              </div>

            </div>

          </div>
        </section>

      </main>

      {/* LUXURY DARK FOOTER - IDENTIQUE À L'ACCUEIL */}
      <footer className="border-t border-[#b7893b]/30 bg-[#0c0a09] py-14 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 lg:px-10">
          <div className="flex w-full flex-col items-center justify-between gap-6 sm:flex-row">
            <BrandLockup light compact />
            
            <p className="text-xs uppercase tracking-[0.25em] text-white/50">
              Pilates · Équilibre · Harmonie · Bir Mourad Raïs
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-white/10 pt-8 text-xs text-white/60">
            <Link href="/mentions-legales" className="transition-colors hover:text-[#e5be78]">
              Mentions Légales
            </Link>
            <span>•</span>
            <Link href="/politique-de-confidentialite" className="transition-colors hover:text-[#e5be78]">
              Politique de Confidentialité
            </Link>
            <span>•</span>
            <Link href="/cgv" className="transition-colors hover:text-[#e5be78]">
              Conditions Générales de Vente (CGV)
            </Link>
          </div>

          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Pilates Center Alger. Tous droits réservés.
          </p>
        </div>
      </footer>

    </div>
  );
}
