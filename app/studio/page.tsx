import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, MapPin, Clock, Users, Award, ShieldCheck, Heart, Phone, Menu, Check } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { PublicHeader } from "@/components/brand/public-header";
import { PublicMobileBottomNav } from "@/components/brand/public-mobile-bottom-nav";

export const metadata = {
  title: "Le Studio · Pilates Center Alger",
  description: "Découvrez notre studio d'exception à Bir Mourad Raïs, Alger. Un lieu dédié au Pilates Reformer & Sol dans un cadre intime et raffiné.",
};

export default function LeStudioPage() {
  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#1c1917] font-sans antialiased selection:bg-[#b7893b] selection:text-white overflow-x-hidden pb-16 md:pb-0">
      
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-radial from-[#e8d5b7]/40 via-[#f3e6d3]/20 to-transparent blur-3xl" />
        <div className="absolute top-[35%] -right-40 h-[600px] w-[600px] rounded-full bg-radial from-[#d4af37]/15 via-transparent to-transparent blur-3xl" />
      </div>

      <PublicHeader />

      <main className="relative z-10">
        
        {/* HERO LE STUDIO */}
        <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-16 lg:px-10 lg:pt-24 lg:pb-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#b7893b]/30 bg-[#b7893b]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#9a712e]">
              <Sparkles className="h-3.5 w-3.5" /> Espace & Philosophie
            </div>
            
            <h1 className="mt-8 font-serif text-[clamp(2.8rem,5.5vw,5.2rem)] font-light leading-[0.98] tracking-tight text-[#1c1917]">
              Un havre de paix <br />
              <span className="relative inline-block font-serif italic text-[#b7893b]">
                dédié au bien-être.
                <svg className="absolute -bottom-2 left-0 w-full text-[#cdae72]/40" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 10C50 3 150 3 198 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>
            
            <p className="mt-8 text-lg leading-relaxed text-[#61574b] lg:text-xl">
              Niché au Centre Commercial Zemzem à Bir Mourad Raïs, Pilates Center est un cocon chaleureux conçu pour vous offrir une expérience d'entraînement privilégiée et haut de gamme.
            </p>
          </div>
        </section>

        {/* SECTION ARCHITECTURE & ATMOSPHÈRE */}
        <section className="py-20 bg-white border-y border-[#e5dacf]">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-12 items-center">
              
              <div className="lg:col-span-6 space-y-6">
                <span className="rounded-full bg-[#b7893b]/15 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#99702d]">
                  Le Studio & L’Équipement
                </span>
                
                <h2 className="font-serif text-3xl font-light text-[#1c1917] sm:text-4xl">
                  Précision, confort & lumière naturelle.
                </h2>

                <p className="text-base leading-relaxed text-[#61574b]">
                  Notre studio a été pensé pour favoriser le calme, la concentration et la fluidité des mouvements. Chaque machine Reformer est choisie pour sa qualité biomécanique irréprochable.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#b7893b]/20 text-[#99702d]">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-[#1c1917]">Machines Reformer de pointe</h3>
                      <p className="text-sm text-[#706659]">Assistance fluide par ressorts de précision pour un allongement musculaire sans stress sur les articulations.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#b7893b]/20 text-[#99702d]">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-[#1c1917]">Espace Tapis & Accessoires</h3>
                      <p className="text-sm text-[#706659]">Tapis de sol haute densité, anneaux Pilates, ballons paille et bandes élastiques fournis pour chaque cours.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#b7893b]/20 text-[#99702d]">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-[#1c1917]">Vestiaires privatifs & Douceur</h3>
                      <p className="text-sm text-[#706659]">Un cadre soigné avec vestiaires fermés, boissons chaudes et eau fraîche à disposition.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="relative h-[540px] sm:h-[620px] lg:h-[680px] w-full overflow-hidden rounded-3xl border border-[#cdae72]/40 shadow-xl">
                  <Image
                    src="/brand/studio-atmosphere.jpg"
                    alt="Séance de Pilates Reformer au studio Pilates Center à Bir Mourad Raïs"
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover object-top transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141210]/80 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/15 bg-black/40 p-5 backdrop-blur-md text-white">
                    <p className="font-serif text-xl italic text-[#e5be78]">"Pilates. Équilibre. Harmonie. Votre bien-être, notre priorité."</p>
                    <p className="mt-2 text-xs uppercase tracking-wider text-white/60">Bir Mourad Raïs · Algérie</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION ENGAGEMENT ET VALEURS */}
        <section className="py-20 bg-[#faf7f2]">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="rounded-full border border-[#b7893b]/30 bg-[#b7893b]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#99702d]">
                Nos Engagements
              </span>
              <h2 className="mt-4 font-serif text-4xl font-light text-[#1c1917] sm:text-5xl">
                Pourquoi choisir Pilates Center ?
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              
              <div className="rounded-3xl border border-[#e5dacf] bg-white p-8 shadow-sm transition-all hover:border-[#b7893b] hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b7893b]/15 text-[#99702d]">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="mt-6 font-serif text-2xl font-normal text-[#1c1917]">Petits comités (4-6 max)</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#61574b]">
                  Pas de cours surchargés. Chaque séance est limitée à 4 ou 6 participantes pour vous garantir l’attention individuelle continue de votre coach.
                </p>
              </div>

              <div className="rounded-3xl border border-[#e5dacf] bg-white p-8 shadow-sm transition-all hover:border-[#b7893b] hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b7893b]/15 text-[#99702d]">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="mt-6 font-serif text-2xl font-normal text-[#1c1917]">Coachs Certifiées</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#61574b]">
                  Une équipe d'enseignantes expérimentées formées à la méthode authentique Joseph Pilates et à l'analyse posturaire.
                </p>
              </div>

              <div className="rounded-3xl border border-[#e5dacf] bg-white p-8 shadow-sm transition-all hover:border-[#b7893b] hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b7893b]/15 text-[#99702d]">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="mt-6 font-serif text-2xl font-normal text-[#1c1917]">Créneaux Dédiés</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#61574b]">
                  Planning clair du Samedi au Jeudi avec plages horaires attribuées spécifiquement aux Femmes et aux Hommes.
                </p>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* LUXURY DARK FOOTER */}
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

      <PublicMobileBottomNav />

    </div>
  );
}
