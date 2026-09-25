import { OpeningHours } from "@/features/public-site/opening-hours";
import Link from "next/link";
import { ArrowRight, Clock, Phone, Menu } from "lucide-react";
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
              Consultez les plages Femmes et Hommes, les ouvertures exceptionnelles et les fermetures prévues par le centre.
            </p>
          </div>
        </section>

        {/* GRILLE DÉTAILLÉE DES HORAIRES */}
        <section className="py-20 bg-white border-y border-[#e5dacf]">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            
            <div className="mx-auto max-w-2xl rounded-3xl border border-[#dccbb0] p-8"><OpeningHours /></div>
            {/* CALLOUT RÉSERVATION */}
            <div className="mt-16 rounded-3xl border border-[#cdae72]/40 bg-[#faf7f2] p-8 text-center shadow-lg">
              <h3 className="font-serif text-2xl font-light text-[#1c1917]">Comment réserver votre créneau ?</h3>
              <p className="mt-3 text-sm text-[#61574b] max-w-xl mx-auto">
                Connectez-vous à votre espace client en ligne pour choisir la date et le créneau qui vous conviennent, ou contactez directement l&apos;accueil du studio.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/reservation"
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
