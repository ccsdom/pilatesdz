import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, MapPin, Clock, Users, Phone, Calendar, ShieldCheck, ChevronRight } from "lucide-react";
import { StudioPricing } from "@/features/packages/studio-pricing";
import { COURSE_MAX_CAPACITY, MONTHLY_OFFERS, QUARTERLY_DISCOUNT_PERCENT } from "@/domain/models/studio-offers";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { PublicHeader } from "@/components/brand/public-header";
import { PublicMobileBottomNav } from "@/components/brand/public-mobile-bottom-nav";

export function PublicSite() {
  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#1c1917] selection:bg-[#b7893b] selection:text-white font-sans antialiased overflow-x-hidden pb-16 md:pb-0">
      
      {/* Dynamic Ambient Background Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-radial from-[#e8d5b7]/40 via-[#f3e6d3]/20 to-transparent blur-3xl" />
        <div className="absolute top-[35%] -right-40 h-[600px] w-[600px] rounded-full bg-radial from-[#d4af37]/15 via-transparent to-transparent blur-3xl" />
        <div className="absolute top-[65%] -left-40 h-[600px] w-[600px] rounded-full bg-radial from-[#c5a059]/15 via-transparent to-transparent blur-3xl" />
      </div>

      {/* Header avec menu mobile interactif natif */}
      <PublicHeader />

      <main className="relative z-10">
        
        {/* HERO SECTION : Frameless Official Poster Illustration on Transparent Background */}
        <section id="studio" className="relative mx-auto max-w-7xl px-6 pt-12 pb-20 lg:px-10 lg:pt-20 lg:pb-32">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            
            {/* Left Content Column */}
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[#b7893b]/30 bg-[#b7893b]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#9a712e]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b7893b] animate-pulse" />
                Pilates Reformer & Sol · Bir Mourad Raïs
              </div>

              <h1 className="mt-8 font-serif text-[clamp(3.2rem,6.2vw,6rem)] font-light leading-[0.95] tracking-tight text-[#1c1917]">
                La force dans <br />
                <span className="relative inline-block font-serif italic text-[#b7893b]">
                  l’équilibre.
                  <svg className="absolute -bottom-2 left-0 w-full text-[#cdae72]/40" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 10C50 3 150 3 198 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </span>
              </h1>

              <p className="mt-8 max-w-xl text-lg leading-relaxed text-[#61574b] lg:text-xl">
                Un espace privilégié dédié au Pilates Reformer et au sol. Sculptez votre corps, perfectionnez votre posture et retrouvez une énergie profonde dans un cadre intime et raffiné.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/reservation"
                  className="group inline-flex items-center gap-3 rounded-full bg-[#b7893b] px-8 py-4 text-sm font-semibold text-black shadow-lg shadow-[#b7893b]/25 transition-all duration-300 hover:bg-[#d7b66f] hover:shadow-xl hover:shadow-[#b7893b]/35"
                >
                  <span>Réserver un cours</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                
                <a
                  href="#horaires"
                  className="inline-flex items-center gap-2 rounded-full border border-[#cdae72]/60 bg-white/60 px-7 py-4 text-sm font-semibold text-[#2c261f] backdrop-blur-md transition-all hover:bg-white hover:border-[#b7893b]"
                >
                  <Clock className="h-4 w-4 text-[#99702d]" />
                  <span>Voir les horaires</span>
                </a>
              </div>

              {/* Metrics Strip */}
              <div className="mt-12 grid grid-cols-3 gap-5 border-t border-[#e2d5c3] pt-6 max-w-lg">
                <div>
                  <div className="font-serif text-lg font-normal text-[#99702d] sm:text-xl">10h – 20h</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.15em] text-[#786c5e]">Ouverture</div>
                </div>
                <div>
                  <div className="font-serif text-lg font-normal text-[#99702d] sm:text-xl">Femmes & Hommes</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.15em] text-[#786c5e]">Créneaux dédiés</div>
                </div>
                <div>
                  <div className="font-serif text-lg font-normal text-[#99702d] sm:text-xl">{COURSE_MAX_CAPACITY} max.</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.15em] text-[#786c5e]">Places / cours</div>
                </div>
              </div>
            </div>

            {/* Right Column: LARGE EXPANDED OFFICIAL POSTER ILLUSTRATION */}
            <div className="relative flex items-center justify-center lg:col-span-6">
              
              {/* Ethereal ambient light halo behind floating illustration */}
              <div className="pointer-events-none absolute h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-[#d4af37]/35 via-[#f4e8d4]/60 to-transparent blur-3xl" />
              <div className="pointer-events-none absolute h-[400px] w-[400px] rounded-full bg-[#b7893b]/25 blur-2xl animate-pulse" />

              {/* Pure Frameless Transparent Background Image Container - Complete Unclipped Illustration */}
              <div className="relative z-10 w-full max-w-[700px] px-2 py-4">
                <Image
                  src="/brand/reformer-hero-poster-illustration.png"
                  alt="Illustration officielle Pilates Center - Postures et Reformer"
                  width={1680}
                  height={1642}
                  priority
                  className="h-auto w-full object-contain drop-shadow-[0_25px_35px_rgba(139,101,43,0.25)] transition-transform duration-700 hover:scale-[1.02]"
                />

                {/* Floating Glassmorphism Micro-Badges */}
                <div className="absolute -top-4 left-0 z-20 hidden rounded-2xl border border-white/70 bg-white/85 p-3.5 shadow-xl backdrop-blur-md sm:block">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b7893b]/15 text-[#9a712e]">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#1c1917]">Sculptfit & Reformer</div>
                      <div className="text-[11px] text-[#786c5e]">Force · Équilibre · Harmonie</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 right-0 z-20 rounded-2xl border border-white/70 bg-white/85 p-3.5 shadow-xl backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1c1917] text-[#e5be78]">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#1c1917]">Séances ajustées</div>
                      <div className="text-[11px] text-[#786c5e]">Du Samedi au Jeudi</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* LES 3 PILIERS DU STUDIO (LE STUDIO · LES COURS · TARIFS) */}
        <section className="py-20 bg-white border-y border-[#e5dacf]">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="rounded-full border border-[#b7893b]/30 bg-[#b7893b]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#99702d]">
                Bienvenue au Studio
              </span>
              <h2 className="mt-4 font-serif text-4xl font-light text-[#1c1917] sm:text-5xl">
                Découvrez Pilates Center Alger
              </h2>
              <p className="mt-4 text-base text-[#61574b]">
                Une méthode d&apos;entraînement authentique pour vous accompagner vers votre meilleur équilibre.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              
              {/* Pilier 1 : Le Studio */}
              <div className="group relative rounded-3xl border border-[#e5dacf] bg-[#faf7f2] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#b7893b] hover:shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b7893b]/15 text-[#99702d]">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 font-serif text-2xl font-normal text-[#1c1917]">LE STUDIO</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#61574b]">
                    Niché au Centre Commercial Zemzem à Bir Mourad Raïs. Un cocon d&apos;exception équipé de machines Reformer haut de gamme.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-[#e5dacf]">
                  <Link href="/le-studio" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#99702d] group-hover:text-[#b7893b]">
                    <span>Découvrir le lieu</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Pilier 2 : Les Cours */}
              <div className="group relative rounded-3xl border border-[#e5dacf] bg-[#faf7f2] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#b7893b] hover:shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b7893b]/15 text-[#99702d]">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 font-serif text-2xl font-normal text-[#1c1917]">LES COURS</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#61574b]">
                    Reformer en petit comité ({COURSE_MAX_CAPACITY} max), Sol Matwork, Cours Duo en binôme et Coaching individuel sur-mesure.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-[#e5dacf]">
                  <Link href="/les-cours" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#99702d] group-hover:text-[#b7893b]">
                    <span>Explorer nos cours</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Pilier 3 : Tarifs */}
              <div className="group relative rounded-3xl border border-[#e5dacf] bg-[#faf7f2] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#b7893b] hover:shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b7893b]/15 text-[#99702d]">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 font-serif text-2xl font-normal text-[#1c1917]">TARIFS & FORMULES</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#61574b]">
                    Séances à l&apos;unité, abonnements de {MONTHLY_OFFERS.map(offer => offer.sessionsPerMonth).join(" ou ")} séances par mois et paiement trimestriel avec remise de {QUARTERLY_DISCOUNT_PERCENT}%.
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-[#e5dacf]">
                  <Link href="/tarifs" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#99702d] group-hover:text-[#b7893b]">
                    <span>Consulter les prix</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

            </div>

          </div>
        </section>


        {/* SECTION: HORAIRES & CRÉNEAUX DÉDIÉS (NOUVEAU DÉTAIL EXACT) */}
        <section id="horaires" className="py-20 bg-[#f5ede0] border-y border-[#e2d5c3]">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            
            <div className="flex flex-col items-center text-center">
              <span className="rounded-full border border-[#b7893b]/30 bg-[#b7893b]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#99702d]">
                Horaires & Planning
              </span>
              <h2 className="mt-4 font-serif text-4xl font-light text-[#1c1917] sm:text-5xl">
                Créneaux réservés & adaptés.
              </h2>
              <p className="mt-4 max-w-xl text-base text-[#61574b]">
                Le studio est ouvert du Samedi au Jeudi de 10h00 à 20h00, avec des plages horraires spécifiquement aménagées pour les Femmes et pour les Hommes.
              </p>
            </div>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              
              {/* Carte 1 : Samedi, Lundi, Mercredi */}
              <div className="rounded-3xl border border-[#dccbb0] bg-white p-8 shadow-sm transition-all hover:border-[#b7893b] hover:shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#b7893b]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#99702d]">
                    Groupe A
                  </span>
                  <Calendar className="h-5 w-5 text-[#8b652b]" />
                </div>
                <h3 className="mt-4 font-serif text-2xl font-normal text-[#1c1917]">
                  Samedi, Lundi & Mercredi
                </h3>
                
                <div className="mt-6 space-y-4 pt-4 border-t border-[#f0e8dd]">
                  <div className="rounded-2xl bg-[#faf6f0] p-4 border border-[#e5dacf]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#8b652b]">Créneau Femmes</span>
                      <span className="text-xs font-semibold text-[#1c1917]">10h00 – 14h00</span>
                    </div>
                    <p className="mt-1 text-xs text-[#706659]">4 heures réservées exclusivement aux dames.</p>
                  </div>

                  <div className="rounded-2xl bg-[#f0ede8] p-4 border border-[#ddd6cc]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#38322a]">Créneau Hommes</span>
                      <span className="text-xs font-semibold text-[#1c1917]">14h00 – 20h00</span>
                    </div>
                    <p className="mt-1 text-xs text-[#706659]">6 heures réservées aux messieurs.</p>
                  </div>
                </div>
              </div>

              {/* Carte 2 : Dimanche, Mardi, Jeudi */}
              <div className="rounded-3xl border border-[#dccbb0] bg-white p-8 shadow-sm transition-all hover:border-[#b7893b] hover:shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#b7893b]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#99702d]">
                    Groupe B
                  </span>
                  <Calendar className="h-5 w-5 text-[#8b652b]" />
                </div>
                <h3 className="mt-4 font-serif text-2xl font-normal text-[#1c1917]">
                  Dimanche, Mardi & Jeudi
                </h3>

                <div className="mt-6 space-y-4 pt-4 border-t border-[#f0e8dd]">
                  <div className="rounded-2xl bg-[#faf6f0] p-4 border border-[#e5dacf]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#8b652b]">Créneau Femmes</span>
                      <span className="text-xs font-semibold text-[#1c1917]">10h00 – 18h00</span>
                    </div>
                    <p className="mt-1 text-xs text-[#706659]">8 heures de séances féminines grand format.</p>
                  </div>

                  <div className="rounded-2xl bg-[#f0ede8] p-4 border border-[#ddd6cc]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#38322a]">Créneau Hommes</span>
                      <span className="text-xs font-semibold text-[#1c1917]">18h00 – 20h00</span>
                    </div>
                    <p className="mt-1 text-xs text-[#706659]">Session du soir réservée aux hommes.</p>
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
                  <h3 className="mt-4 font-serif text-2xl font-normal text-[#1c1917]">
                    Vendredi
                  </h3>
                  <div className="mt-6 rounded-2xl bg-white/70 p-6 border border-[#cdae72]/30 text-center">
                    <span className="font-serif text-3xl font-light text-[#9a702c]">Fermé</span>
                    <p className="mt-2 text-xs text-[#706659]">Fermeture du studio pour entretien et repos des coachs.</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#cdae72]/30 text-center">
                  <a href="tel:0553021714" className="text-xs font-semibold text-[#8b652b] hover:underline">
                    Renseignements : 05 53 02 17 14
                  </a>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION: L'EXPÉRIENCE STUDIO (Atmosphère & Philosophie) */}
        <section id="experience" className="relative bg-[#141210] py-24 text-white overflow-hidden">
          <div className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-[#b7893b]/10 blur-[140px]" />
          
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid items-center gap-12 lg:grid-cols-12">
              
              {/* Studio Visual Atmosphere */}
              <div className="relative lg:col-span-6">
                <div className="relative h-[540px] sm:h-[620px] lg:h-[680px] w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
                  <Image
                    src="/brand/studio-atmosphere.jpg"
                    alt="Séance de Pilates Reformer au studio Pilates Center à Bir Mourad Raïs"
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover object-top transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141210] via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/15 bg-black/40 p-5 backdrop-blur-md">
                    <p className="font-serif text-xl italic text-[#e5be78]">&quot;Pilates. Équilibre. Harmonie. Votre bien-être, notre priorité.&quot;</p>
                    <p className="mt-2 text-xs uppercase tracking-wider text-white/60">Bir Mourad Raïs · Algérie</p>
                  </div>
                </div>
              </div>

              {/* Studio Pillars & Philosophy */}
              <div className="lg:col-span-6">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c79b4d]">L’Expérience Pilates Center</span>
                <h2 className="mt-4 font-serif text-4xl font-light leading-tight sm:text-5xl">
                  Force, Équilibre & <br />
                  <span className="italic text-[#c79b4d]">Harmonie corporelle.</span>
                </h2>
                <p className="mt-6 text-base leading-relaxed text-white/65">
                  Chaque cours est une étape de reconnexion. Dans notre studio de Bir Mourad Raïs, nous accompagnons chaque élève avec rigueur, écoute et bienveillance.
                </p>

                <div className="mt-10 space-y-6">
                  <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all hover:border-[#b7893b]/40">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#b7893b]/20 text-[#c79b4d]">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-white">FORCE · Renforcement Profond</h3>
                      <p className="mt-1 text-sm text-white/55">Travail en profondeur de la sangle abdominale, des muscles stabilisateurs et de la posture.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all hover:border-[#b7893b]/40">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#b7893b]/20 text-[#c79b4d]">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-white">ÉQUILIBRE & BIEN-ÊTRE</h3>
                      <p className="mt-1 text-sm text-white/55">Trouvez votre équilibre intérieur et extérieur tout en prenant soin de votre corps et de votre esprit.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION: NOS PRATIQUES */}
        <section id="pratiques" className="py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            
            <div className="flex flex-col items-center text-center">
              <span className="rounded-full border border-[#b7893b]/30 bg-[#b7893b]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#99702d]">
                Méthode & Disciplines
              </span>
              <h2 className="mt-4 font-serif text-4xl font-light text-[#1c1917] sm:text-5xl">
                Quatre manières d’exceller.
              </h2>
              <p className="mt-4 max-w-xl text-base text-[#676056]">
                Que vous recherchiez le renforcement profond du sol ou l&apos;assistance fluide du Reformer, chaque séance est adaptée à votre niveau.
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              
              <Link href="/pratiques#sol" className="group relative flex flex-col justify-between rounded-3xl border border-[#e5dacf] bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-[#b7893b] hover:shadow-2xl hover:shadow-[#b7893b]/15">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-[#b7893b]">
                    <span>01</span>
                    <span className="rounded-full bg-[#f4efe6] px-2.5 py-0.5 uppercase tracking-wider text-[#8b652b]">Tapis / Mat</span>
                  </div>
                  <h3 className="mt-6 font-serif text-2xl font-normal text-[#1c1917]">Pilates au sol</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#676056]">
                    Centrage, travail de la ceinture abdominale, souplesse et maîtrise de la respiration sans machine.
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-[#f0e8dd] flex items-center justify-between text-xs font-semibold text-[#1c1917] group-hover:text-[#b7893b]">
                  <span>En savoir plus</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>

              <Link href="/pratiques#reformer" className="group relative flex flex-col justify-between rounded-3xl border-2 border-[#b7893b] bg-gradient-to-b from-[#fffefc] to-[#f9f2e7] p-8 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#b7893b]/25">
                <span className="absolute -top-3.5 right-6 rounded-full bg-[#1c1917] px-3.5 py-1 text-[11px] font-medium tracking-wider text-[#e5be78]">
                  Star du studio
                </span>
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-[#b7893b]">
                    <span>02</span>
                    <span className="rounded-full bg-[#b7893b]/20 px-2.5 py-0.5 uppercase tracking-wider text-[#7e581b]">Reformer</span>
                  </div>
                  <h3 className="mt-6 font-serif text-2xl font-normal text-[#1c1917]">Pilates Reformer</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#676056]">
                    Exercices guidés par ressorts et sangles pour une résistance progressive et un allongement musculaire optimal.
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-[#cdae72]/30 flex items-center justify-between text-xs font-semibold text-[#1c1917] group-hover:text-[#b7893b]">
                  <span>Découvrir le Reformer</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>

              <Link href="/pratiques" className="group relative flex flex-col justify-between rounded-3xl border border-[#e5dacf] bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-[#b7893b] hover:shadow-2xl hover:shadow-[#b7893b]/15">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-[#b7893b]">
                    <span>03</span>
                    <span className="rounded-full bg-[#f4efe6] px-2.5 py-0.5 uppercase tracking-wider text-[#8b652b]">Groupe</span>
                  </div>
                  <h3 className="mt-6 font-serif text-2xl font-normal text-[#1c1917]">Cours Collectifs</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#676056]">
                    Énergie de groupe conviviale limitée à {COURSE_MAX_CAPACITY} participantes pour maintenir un suivi personnalisé.
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-[#f0e8dd] flex items-center justify-between text-xs font-semibold text-[#1c1917] group-hover:text-[#b7893b]">
                  <span>Voir le détail</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>

              <Link href="/pratiques" className="group relative flex flex-col justify-between rounded-3xl border border-[#e5dacf] bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-[#b7893b] hover:shadow-2xl hover:shadow-[#b7893b]/15">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-[#b7893b]">
                    <span>04</span>
                    <span className="rounded-full bg-[#f4efe6] px-2.5 py-0.5 uppercase tracking-wider text-[#8b652b]">Privé</span>
                  </div>
                  <h3 className="mt-6 font-serif text-2xl font-normal text-[#1c1917]">Cours Individuels</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#676056]">
                    Accompagnement 1-on-1 exclusif conçu spécifiquement autour de vos objectifs physiques et de posture.
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-[#f0e8dd] flex items-center justify-between text-xs font-semibold text-[#1c1917] group-hover:text-[#b7893b]">
                  <span>Découvrir le coaching</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>

            </div>
          </div>
        </section>

        {/* SECTION: TARIFS & ABONNEMENTS */}
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <StudioPricing />
        </div>

        {/* SECTION: INFOS PRATIQUES, LOCALISATION & CONTACT */}
        <section id="contact" className="py-24 bg-[#f3e9da] border-t border-[#e2d5c3]">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="rounded-3xl border border-[#cdae72]/40 bg-[#faf7f2] p-8 lg:p-12 shadow-lg">
              <div className="grid gap-10 lg:grid-cols-12 items-center">
                
                <div className="lg:col-span-7 space-y-6">
                  <span className="rounded-full bg-[#b7893b]/15 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#99702d]">
                    Nous Trouver & Contact
                  </span>
                  <h2 className="font-serif text-3xl font-light text-[#1c1917] sm:text-4xl">
                    Centre Commercial Zemzem, Bir Mourad Raïs.
                  </h2>
                  <p className="text-base text-[#61574b]">
                    Notre studio vous accueille dans un cadre moderne et facile d&apos;accès avec stationnement à proximité.
                  </p>

                  <div className="grid gap-6 sm:grid-cols-2 pt-4">
                    
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#b7893b]/20 text-[#99702d]">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-[#99702d]">Adresse Exacte</div>
                        <div className="mt-1 text-sm font-medium text-[#1c1917]">Centre commercial Zemzem</div>
                        <div className="text-xs text-[#706659]">P2QQ+P4V, Bir Mourad Raïs, Algérie</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#b7893b]/20 text-[#99702d]">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-[#99702d]">Téléphone & Contact</div>
                        <a href="tel:0553021714" className="mt-1 inline-block text-base font-semibold text-[#1c1917] hover:text-[#8b652b]">
                          05 53 02 17 14
                        </a>
                        <div className="text-xs text-[#706659]">Appels & Renseignements</div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="lg:col-span-5 flex flex-col items-center justify-center rounded-2xl border border-[#cdae72]/50 bg-gradient-to-b from-[#1c1917] to-[#2c2621] p-8 text-center text-white shadow-xl">
                  <h3 className="font-serif text-2xl font-light text-[#e5be78]">Réservez votre séance</h3>
                  <p className="mt-3 text-sm text-white/70">
                    Connectez-vous à votre espace client pour choisir votre créneau selon le planning Femmes ou Hommes.
                  </p>
                  <Link
                    href="/espace-cliente"
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#b7893b] px-6 py-3.5 text-sm font-semibold text-black transition-all hover:bg-[#d7b66f]"
                  >
                    <span>Accéder à l’espace client</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

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

      {/* Fixed Native Mobile Bottom Navigation */}
      <PublicMobileBottomNav />

    </div>
  );
}


