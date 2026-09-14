import Link from "next/link";
import { ArrowRight, Phone, Menu, Sparkles, ShieldCheck, Clock, Users, MapPin } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { BookingWizard } from "@/features/public-site/booking-wizard";

export const metadata = {
  title: "Réserver un Cours · Pilates Center Alger",
  description: "Réservez votre cours de Pilates Reformer en ligne au studio de Bir Mourad Raïs (Centre Commercial Zemzem). Petit groupe de 4 personnes max, créneaux dédiés Femmes et Hommes.",
};

export default function ReservationPage() {
  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#1c1917] font-sans antialiased selection:bg-[#b7893b] selection:text-white overflow-x-hidden">
      
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-radial from-[#e8d5b7]/40 via-[#f3e6d3]/20 to-transparent blur-3xl" />
        <div className="absolute top-[35%] -right-40 h-[600px] w-[600px] rounded-full bg-radial from-[#d4af37]/15 via-transparent to-transparent blur-3xl" />
      </div>

      {/* Header Glassmorphism */}
      <header className="sticky top-0 z-50 border-b border-[#e7dac8]/60 bg-[#faf7f2]/85 backdrop-blur-xl transition-all duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <BrandLockup compact />
          
          <nav className="hidden items-center gap-9 text-xs font-medium uppercase tracking-[0.2em] text-[#524b42] lg:flex">
            <Link href="/studio" className="transition-colors hover:text-[#99702d]">Le Studio</Link>
            <Link href="/pratiques" className="transition-colors hover:text-[#99702d]">Nos Pratiques</Link>
            <Link href="/horaires" className="transition-colors hover:text-[#99702d]">Horaires</Link>
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
              href="/espace-cliente" 
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[#1c1917] px-6 py-2.5 text-xs font-semibold tracking-wider text-white shadow-md transition-all duration-300 hover:bg-[#b7893b] hover:text-black hover:shadow-xl hover:shadow-[#b7893b]/20"
            >
              <span>Mon Espace</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
            <button className="p-2 text-[#1c1917] lg:hidden" aria-label="Ouvrir le menu">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        
        {/* HERO RESERVATION */}
        <section className="relative mx-auto max-w-7xl px-6 pt-12 pb-8 lg:px-10 lg:pt-16 lg:pb-12">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#b7893b]/30 bg-[#b7893b]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#9a712e]">
              <Sparkles className="h-3.5 w-3.5" /> Réservation En Ligne
            </div>
            
            <h1 className="mt-6 font-serif text-[clamp(2.5rem,5vw,4.8rem)] font-light leading-[0.98] tracking-tight text-[#1c1917]">
              Réservez votre séance de Reformer
            </h1>
            
            <p className="mt-6 text-base leading-relaxed text-[#61574b] lg:text-lg">
              Sélectionnez votre discipline, le créneau adapté (Femmes / Hommes) et réservez votre machine Reformer en quelques clics.
            </p>

            {/* Quick Guarantees Badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[#524b42]">
              <div className="flex items-center gap-2 rounded-full border border-[#dccbb0] bg-white px-4 py-2 shadow-xs">
                <Users className="h-4 w-4 text-[#99702d]" />
                <span>Max 4 personnes / cours</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#dccbb0] bg-white px-4 py-2 shadow-xs">
                <Clock className="h-4 w-4 text-[#99702d]" />
                <span>Créneaux séparés Femmes & Hommes</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#dccbb0] bg-white px-4 py-2 shadow-xs">
                <ShieldCheck className="h-4 w-4 text-[#99702d]" />
                <span>Annulation gratuite H-12</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION WIZARD DE RÉSERVATION */}
        <section className="pb-24">
          <div className="mx-auto max-w-5xl px-6 lg:px-10">
            <BookingWizard />
          </div>
        </section>

        {/* FAQ & INFOS PRATIQUES */}
        <section className="border-t border-[#e7dac8]/60 bg-[#f5ede2]/60 py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="font-serif text-3xl font-light text-[#1c1917]">Questions fréquentes sur la réservation</h2>
              <p className="mt-2 text-sm text-[#61574b]">Tout ce qu'il faut savoir avant votre venue au studio.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-3xl border border-[#dccbb0] bg-white p-6 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#99702d]">Que dois-je apporter ?</div>
                <h3 className="font-serif text-lg text-[#1c1917]">Tenue & Chaussettes</h3>
                <p className="text-xs leading-relaxed text-[#61574b]">
                  Une tenue de sport confortable et ajustée ainsi que des chaussettes antidérapantes. Le matériel et les serviettes sont fournis sur place.
                </p>
              </div>

              <div className="rounded-3xl border border-[#dccbb0] bg-white p-6 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#99702d]">Politique d'annulation</div>
                <h3 className="font-serif text-lg text-[#1c1917]">Annulation sans frais H-12</h3>
                <p className="text-xs leading-relaxed text-[#61574b]">
                  Vous pouvez annuler ou reporter votre séance sans frais jusqu'à 12 heures avant l'heure du cours depuis votre espace cliente ou par téléphone.
                </p>
              </div>

              <div className="rounded-3xl border border-[#dccbb0] bg-white p-6 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#99702d]">Emplacement du Studio</div>
                <h3 className="font-serif text-lg text-[#1c1917]">Centre Commercial Zemzem</h3>
                <p className="text-xs leading-relaxed text-[#61574b]">
                  Le studio est situé à Bir Mourad Raïs avec un accès facile et un parking sécurisé. Téléphone accueil : 05 53 02 17 14.
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

    </div>
  );
}
