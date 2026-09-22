import Link from "next/link";
import { ArrowRight, MapPin, Phone, Clock, Mail, Sparkles } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { PublicHeader } from "@/components/brand/public-header";
import { PublicMobileBottomNav } from "@/components/brand/public-mobile-bottom-nav";
import { ContactForm } from "@/features/public-site/contact-form";

export const metadata = {
  title: "Contact & Localisation · Pilates Center Alger",
  description: "Contactez le studio Pilates Center à Bir Mourad Raïs (Centre Commercial Zemzem), téléphone 05 53 02 17 14. Plan d'accès et renseignements.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#1c1917] font-sans antialiased selection:bg-[#b7893b] selection:text-white overflow-x-hidden pb-16 md:pb-0">
      
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-radial from-[#e8d5b7]/40 via-[#f3e6d3]/20 to-transparent blur-3xl" />
        <div className="absolute top-[35%] -right-40 h-[600px] w-[600px] rounded-full bg-radial from-[#d4af37]/15 via-transparent to-transparent blur-3xl" />
      </div>

      <PublicHeader />

      <main className="relative z-10">
        
        {/* HERO CONTACT */}
        <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-12 lg:px-10 lg:pt-24 lg:pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#b7893b]/30 bg-[#b7893b]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#9a712e]">
              <Phone className="h-3.5 w-3.5" /> Contact & Localisation
            </div>
            
            <h1 className="mt-8 font-serif text-[clamp(2.8rem,5.5vw,5.2rem)] font-light leading-[0.98] tracking-tight text-[#1c1917]">
              Nous contacter & nous trouver
            </h1>
            
            <p className="mt-8 text-lg leading-relaxed text-[#61574b] lg:text-xl">
              Toute l'équipe de Pilates Center Alger est à votre écoute pour répondre à vos questions, vous orienter vers la bonne formule ou planifier votre cours d'essai.
            </p>
          </div>
        </section>

        {/* SECTION INFOS & FORMULAIRE */}
        <section className="pb-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-12">
              
              {/* Coordonnées & Accès */}
              <div className="lg:col-span-5 space-y-8">
                
                <div className="rounded-3xl border border-[#dccbb0] bg-white p-8 shadow-sm space-y-6">
                  <h2 className="font-serif text-2xl font-normal text-[#1c1917]">Coordonnées du Studio</h2>
                  
                  <div className="space-y-5">
                    
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#b7893b]/20 text-[#99702d]">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-[#99702d]">Adresse Principale</div>
                        <div className="mt-1 text-base font-semibold text-[#1c1917]">Centre Commercial Zemzem</div>
                        <div className="text-xs text-[#706659]">Bir Mourad Raïs, Alger, Algérie</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#b7893b]/20 text-[#99702d]">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-[#99702d]">Téléphone & Réservations</div>
                        <a href="tel:0553021714" className="mt-1 inline-block text-lg font-bold text-[#1c1917] hover:text-[#8b652b]">
                          05 53 02 17 14
                        </a>
                        <div className="text-xs text-[#706659]">Appels & Renseignements directs</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#b7893b]/20 text-[#99702d]">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-[#99702d]">Heures d’Ouverture</div>
                        <div className="mt-1 text-sm font-medium text-[#1c1917]">Samedi – Jeudi : 09h00 – 19h30</div>
                        <div className="text-xs text-[#706659]">Créneaux dédiés Femmes & Hommes</div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="rounded-3xl border border-[#cdae72]/40 bg-gradient-to-b from-[#1c1917] to-[#2c2621] p-8 text-white shadow-xl">
                  <h3 className="font-serif text-2xl font-light text-[#e5be78]">Espace Membre</h3>
                  <p className="mt-3 text-sm text-white/70">
                    Déjà cliente ? Connectez-vous à votre espace membre pour réserver, annuler ou consulter votre solde de crédits.
                  </p>
                  <Link
                    href="/connexion"
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#b7893b] px-6 py-3.5 text-sm font-semibold text-black hover:bg-[#d7b66f] transition-all"
                  >
                    <span>Accéder à l’espace client</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

              </div>

              {/* Formulaire de Message (Client Component) */}
              <div className="lg:col-span-7">
                <ContactForm />
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
