import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { PublicHeader } from "@/components/brand/public-header";
import { PublicMobileBottomNav } from "@/components/brand/public-mobile-bottom-nav";
import { StudioPricing } from "@/features/packages/studio-pricing";
import { QUARTERLY_DISCOUNT_PERCENT } from "@/domain/models/studio-offers";

export const metadata = {
  title: "Tarifs & Abonnements · Pilates Center Alger",
  description: `Consultez nos séances à l’unité et nos abonnements mensuels et trimestriels avec une remise de ${QUARTERLY_DISCOUNT_PERCENT} %.`,
};

export default function TarifsPage() {
  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#1c1917] font-sans antialiased selection:bg-[#b7893b] selection:text-white overflow-x-hidden pb-16 md:pb-0">
      
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-radial from-[#e8d5b7]/40 via-[#f3e6d3]/20 to-transparent blur-3xl" />
        <div className="absolute top-[35%] -right-40 h-[600px] w-[600px] rounded-full bg-radial from-[#d4af37]/15 via-transparent to-transparent blur-3xl" />
      </div>

      <PublicHeader />

      <main className="relative z-10">
        
        {/* HERO TARIFS */}
        <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-12 lg:px-10 lg:pt-24 lg:pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#b7893b]/30 bg-[#b7893b]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#9a712e]">
              <Sparkles className="h-3.5 w-3.5" /> Transparence & Formules
            </div>
            
            <h1 className="mt-8 font-serif text-[clamp(2.8rem,5.5vw,5.2rem)] font-light leading-[0.98] tracking-tight text-[#1c1917]">
              Tarifs & Abonnements
            </h1>
            
            <p className="mt-8 text-lg leading-relaxed text-[#61574b] lg:text-xl">
              Trouvez la formule idéale adaptée à vos objectifs. Séances à l’unité ou engagements réguliers avec remise trimestrielle de {QUARTERLY_DISCOUNT_PERCENT} %.
            </p>
          </div>
        </section>

        {/* COMPOSANT STUDIO PRICING DE LUXE */}
        <section className="pb-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <StudioPricing />
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
