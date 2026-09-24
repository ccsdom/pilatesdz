import Link from "next/link";
import { ArrowLeft, ShieldCheck, MapPin, Phone, FileText } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";

export const metadata = {
  title: "Mentions Légales · Pilates Center Alger",
  description: "Mentions légales, informations éditeur et conditions d'utilisation du site Pilates Center Alger.",
};

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#1c1917] font-sans antialiased selection:bg-[#b7893b] selection:text-white">
      
      {/* Header */}
      <header className="border-b border-[#e7dac8]/60 bg-[#faf7f2]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <BrandLockup compact />
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[#cdae72]/50 px-4 py-2 text-xs font-semibold text-[#38322a] transition-all hover:bg-[#f3e6d3]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Retour à l&apos;accueil</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-16 lg:px-10 lg:py-24">
        
        <div className="inline-flex items-center gap-2 rounded-full border border-[#b7893b]/30 bg-[#b7893b]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#99702d]">
          Informations Réglementaires
        </div>

        <h1 className="mt-6 font-serif text-4xl font-light text-[#1c1917] sm:text-5xl">
          Mentions Légales
        </h1>
        <p className="mt-4 text-base text-[#61574b]">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </p>

        <div className="mt-12 space-y-10 text-[#403930] leading-relaxed">
          
          {/* Article 1 */}
          <section className="rounded-3xl border border-[#e5dacf] bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-[#99702d]">
              <FileText className="h-5 w-5" />
              <h2 className="font-serif text-2xl font-normal text-[#1c1917]">1. Éditeur du Site</h2>
            </div>
            <p className="mt-4 text-sm text-[#61574b]">
              Le site web <strong>Pilates Center Alger</strong> est édité par l&apos;établissement sous l&apos;enseigne commerciale <strong>PILATES CENTER / SCULPTFIT STUDIO</strong>.
            </p>
            
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#8b652b] shrink-0" />
                <span><strong>Adresse du studio :</strong> Centre commercial Zemzem, P2QQ+P4V, Bir Mourad Raïs, Algérie</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#8b652b] shrink-0" />
                <span><strong>Téléphone :</strong> <a href="tel:0553021714" className="hover:underline text-[#8b652b]">05 53 02 17 14</a></span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#8b652b] shrink-0" />
                <span><strong>Activité :</strong> Centre d&apos;enseignement du Pilates au sol, Reformer et coaching corporel.</span>
              </li>
            </ul>
          </section>

          {/* Article 2 */}
          <section className="rounded-3xl border border-[#e5dacf] bg-white p-8 shadow-sm">
            <h2 className="font-serif text-2xl font-normal text-[#1c1917]">2. Hébergement & Infrastructure Web</h2>
            <p className="mt-4 text-sm">
              L’application web et l&apos;infrastructure de réservation en ligne sont hébergées sur des serveurs sécurisés conformes aux normes internationales de protection des données, avec stockage des sessions et authentification chiffrée.
            </p>
          </section>

          {/* Article 3 */}
          <section className="rounded-3xl border border-[#e5dacf] bg-white p-8 shadow-sm">
            <h2 className="font-serif text-2xl font-normal text-[#1c1917]">3. Propriété Intellectuelle</h2>
            <p className="mt-4 text-sm">
              L&apos;ensemble des éléments figurant sur le site (textes, graphismes, logos, éléments visuels, illustrations d&apos;affiches, icônes, photographies et code informatique) est la propriété exclusive de <strong>Pilates Center Alger</strong>. Toute reproduction, représentation, modification ou adaptation totale ou partielle sans autorisation écrite préalable est strictement interdite.
            </p>
          </section>

          {/* Article 4 */}
          <section className="rounded-3xl border border-[#e5dacf] bg-white p-8 shadow-sm">
            <h2 className="font-serif text-2xl font-normal text-[#1c1917]">4. Limites de Responsabilité</h2>
            <p className="mt-4 text-sm">
              Pilates Center s&apos;efforce de fournir des informations précises et à jour sur son planning et ses tarifs. Toutefois, l&apos;établissement ne saurait être tenu responsable d&apos;éventuelles interruptions temporaires de service dues à la maintenance informatique ou à des cas de force majeure.
            </p>
          </section>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#b7893b]/30 bg-[#0c0a09] py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row lg:px-10">
          <BrandLockup light compact />
          <div className="flex gap-6 text-xs text-white/60">
            <Link href="/politique-de-confidentialite" className="hover:underline">Confidentialité</Link>
            <Link href="/cgv" className="hover:underline">CGV</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
