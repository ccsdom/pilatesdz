import Link from "next/link";
import { ArrowRight, Sparkles, Clock, Calendar, ShieldCheck, Users, Phone, Menu, CheckCircle2 } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";

export const metadata = {
  title: "Horaires & Planning · Pilates Center Alger",
  description: "Consultez les horaires d'ouverture et les créneaux dédiés Femmes et Hommes au studio Pilates Center à Bir Mourad Raïs.",
};

export default function HorairesPage() {
  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#1c1917] font-sans antialiased selection:bg-[#b7893b] selection:text-white overflow-x-hidden">
      
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-radial from-[#e8d5b7]/40 via-[#f3e6d3]/20 to-transparent blur-3xl" />
        <div className="absolute top-[35%] -right-40 h-[600px] w-[600px] rounded-full bg-radial from-[#d4af37]/15 via-transparent to-transparent blur-3xl" />
      </div>

      {/* Header Glassmorphism - IDENTIQUE À L'ACCUEIL */}
      <header className="sticky top-0 z-50 border-b border-[#e7dac8]/60 bg-[#faf7f2]/85 backdrop-blur-xl transition-all duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <BrandLockup compact />
          
          <nav className="hidden items-center gap-9 text-xs font-medium uppercase tracking-[0.2em] text-[#524b42] lg:flex">
            <Link href="/studio" className="transition-colors hover:text-[#99702d]">Le Studio</Link>
            <Link href="/pratiques" className="transition-colors hover:text-[#99702d]">Nos Pratiques</Link>
            <Link href="/horaires" className="text-[#99702d] font-semibold">Horaires</Link>
            <Link href="/tarifs" className="transition-colors hover:text-[#99702d]">Tarifs</Link>
            <Link href="/contact" className="transition-colors hover:text-[#99702d]">Contact</Link>
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
        
        {/* HERO HORAIRES */}
        <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-16 lg:px-10 lg:pt-24 lg:pb-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#b7893b]/30 bg-[#b7893b]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#9a712e]">
              <Clock className="h-3.5 w-3.5" /> Heures d’Ouverture & Planning
            </div>
            
            <h1 className="mt-8 font-serif text-[clamp(2.8rem,5.5vw,5.2rem)] font-light leading-[0.98] tracking-tight text-[#1c1917]">
              Des créneaux ajustés <br />
              <span className="relative inline-block font-serif italic text-[#b7893b]">
                à votre rythme.
                <svg className="absolute -bottom-2 left-0 w-full text-[#cdae72]/40" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 10C50 3 150 3 198 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>
            
            <p className="mt-8 text-lg leading-relaxed text-[#61574b] lg:text-xl">
              Le studio est ouvert du Samedi au Jeudi de 10h00 à 20h00, avec une répartition horaire spécifiquement aménagée pour les séances Femmes et Hommes.
            </p>
          </div>
        </section>

        {/* GRILLE DÉTAILLÉE DES HORAIRES */}
        <section className="py-20 bg-white border-y border-[#e5dacf]">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            
            <div className="grid gap-8 md:grid-cols-3">
              
              {/* Carte 1 : Samedi, Lundi, Mercredi */}
              <div className="rounded-3xl border border-[#dccbb0] bg-gradient-to-b from-[#ffffff] to-[#faf6f0] p-8 shadow-md transition-all hover:border-[#b7893b] hover:shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#b7893b]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#99702d]">
                    Jours A
                  </span>
                  <Calendar className="h-5 w-5 text-[#8b652b]" />
                </div>
                <h2 className="mt-4 font-serif text-2xl font-normal text-[#1c1917]">
                  Samedi, Lundi & Mercredi
                </h2>
                
                <div className="mt-6 space-y-4 pt-4 border-t border-[#f0e8dd]">
                  <div className="rounded-2xl bg-white p-5 border border-[#e5dacf] shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#8b652b]">🌸 Créneau Femmes</span>
                      <span className="text-sm font-semibold text-[#1c1917]">10h00 – 14h00</span>
                    </div>
                    <p className="mt-2 text-xs text-[#706659]">4 heures de séances réservées exclusivement aux dames.</p>
                  </div>

                  <div className="rounded-2xl bg-[#f5ede3] p-5 border border-[#ddd6cc]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#38322a]">🌿 Créneau Hommes</span>
                      <span className="text-sm font-semibold text-[#1c1917]">14h00 – 20h00</span>
                    </div>
                    <p className="mt-2 text-xs text-[#706659]">6 heures réservées aux séances pour hommes.</p>
                  </div>
                </div>
              </div>

              {/* Carte 2 : Dimanche, Mardi, Jeudi */}
              <div className="rounded-3xl border border-[#dccbb0] bg-gradient-to-b from-[#ffffff] to-[#faf6f0] p-8 shadow-md transition-all hover:border-[#b7893b] hover:shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#b7893b]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#99702d]">
                    Jours B
                  </span>
                  <Calendar className="h-5 w-5 text-[#8b652b]" />
                </div>
                <h2 className="mt-4 font-serif text-2xl font-normal text-[#1c1917]">
                  Dimanche, Mardi & Jeudi
                </h2>

                <div className="mt-6 space-y-4 pt-4 border-t border-[#f0e8dd]">
                  <div className="rounded-2xl bg-white p-5 border border-[#e5dacf] shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#8b652b]">🌸 Créneau Femmes</span>
                      <span className="text-sm font-semibold text-[#1c1917]">10h00 – 18h00</span>
                    </div>
                    <p className="mt-2 text-xs text-[#706659]">8 heures complètes dédiées aux séances féminines.</p>
                  </div>

                  <div className="rounded-2xl bg-[#f5ede3] p-5 border border-[#ddd6cc]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#38322a]">🌿 Créneau Hommes</span>
                      <span className="text-sm font-semibold text-[#1c1917]">18h00 – 20h00</span>
                    </div>
                    <p className="mt-2 text-xs text-[#706659]">Session du soir réservée aux hommes.</p>
                  </div>
                </div>
              </div>

              {/* Carte 3 : Vendredi (Repos) */}
              <div className="rounded-3xl border border-[#e2d5c3] bg-gradient-to-b from-[#faf7f2] to-[#f3e9da] p-8 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-[#1c1917]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#676056]">
                      Repos hebdomadaire
                    </span>
                    <Clock className="h-5 w-5 text-[#786c5e]" />
                  </div>
                  <h2 className="mt-4 font-serif text-2xl font-normal text-[#1c1917]">
                    Vendredi
                  </h2>
                  <div className="mt-6 rounded-2xl bg-white/80 p-6 border border-[#cdae72]/30 text-center shadow-sm">
                    <span className="font-serif text-3xl font-light text-[#9a702c]">Fermé</span>
                    <p className="mt-2 text-xs text-[#706659]">Fermeture hebdomadaire pour entretien et repos de l'équipe.</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#cdae72]/30 text-center">
                  <a href="tel:0553021714" className="text-xs font-semibold text-[#8b652b] hover:underline">
                    Renseignements téléphoniques : 05 53 02 17 14
                  </a>
                </div>
              </div>

            </div>

            {/* CALLOUT RÉSERVATION */}
            <div className="mt-16 rounded-3xl border border-[#cdae72]/40 bg-[#faf7f2] p-8 text-center shadow-lg">
              <h3 className="font-serif text-2xl font-light text-[#1c1917]">Comment réserver votre créneau ?</h3>
              <p className="mt-3 text-sm text-[#61574b] max-w-xl mx-auto">
                Connectez-vous à votre espace client en ligne pour choisir la date et le créneau qui vous conviennent, ou contactez directement l'accueil du studio.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/espace-cliente"
                  className="inline-flex items-center gap-2 rounded-full bg-[#b7893b] px-7 py-3.5 text-sm font-semibold text-black hover:bg-[#d7b66f]"
                >
                  <span>Accéder au planning en ligne</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
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

    </div>
  );
}
