import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

export const financeSurface = "rounded-2xl border border-[#e3dbce] bg-[#fffdf9] dark:border-white/10 dark:bg-[#191713]";
export const financeMuted = "text-[#766b5c] dark:text-[#b4a898]";
export const financeLink = "inline-flex items-center justify-center gap-2 rounded-xl border border-[#b7893b]/30 px-4 py-2.5 text-xs font-medium transition hover:bg-[#b7893b]/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b7893b]";

export function FinanceHero({ title, description, icon: Icon, children }: { title: string; description: string; icon: LucideIcon; children: React.ReactNode }) {
  return <header className="relative overflow-hidden rounded-3xl border border-[#b7893b]/25 bg-[#201f1a] p-6 text-[#fff8eb] sm:p-8">
    <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-[#d8b97f]/15" />
    <div className="relative flex items-start justify-between gap-5"><div><p className="mb-4 text-[10px] font-medium uppercase tracking-[0.25em] text-[#d8b97f]">Gestion du centre · Pilates Center</p><h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl">{title}<span className="text-[#d8b97f]">.</span></h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#c6bcab]">{description}</p></div><span className="hidden rounded-2xl border border-[#d8b97f]/20 bg-[#d8b97f]/10 p-4 text-[#d8b97f] sm:inline-flex"><Icon size={30} strokeWidth={1.2} /></span></div>
    <div className="relative mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-5">{children}</div>
  </header>;
}

export function FinanceAction({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className={`${financeLink} border-[#d8b97f]/30 text-[#f1dbb2] hover:bg-white/10`}>{children}<ArrowUpRight size={15} /></Link>;
}
