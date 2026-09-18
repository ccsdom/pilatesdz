import Link from "next/link";
import { UsersRound, LayoutDashboard, KeyRound, CalendarDays, BookmarkCheck, WalletCards, CreditCard } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { CrmHeader } from "@/features/crm/crm-header";

export function ClientShell({ centerId, children, active = "clients" }: { centerId: string; children: React.ReactNode; active?: "clients" | "planning" | "reservations" | "packages" | "cash" | "access" }) {
  const itemClass = (selected: boolean) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${selected ? "bg-[#b7893b] text-black shadow-xs" : "text-white/70 hover:bg-white/10 hover:text-white"}`;
  return <div className="min-h-screen bg-[#f3eee5] text-[#1c1b19] dark:bg-[#0f0e0c] dark:text-[#f4ede2] lg:flex">
    <aside className="bg-[#080808] dark:bg-[#0a0908] p-5 text-white lg:w-64 lg:shrink-0 border-r border-white/5"><div className="border-b border-white/10 pb-5"><BrandLockup light compact /></div>
      <nav aria-label="Navigation CRM" className="mt-5 flex flex-wrap gap-2 lg:flex-col">
        <Link href="/crm" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"><LayoutDashboard size={18} />Tableau de bord</Link>
        <Link href="/crm/planning" aria-current={active === "planning" ? "page" : undefined} className={itemClass(active === "planning")}><CalendarDays size={18} />Planning</Link>
        <Link href="/crm/reservations" aria-current={active === "reservations" ? "page" : undefined} className={itemClass(active === "reservations")}><BookmarkCheck size={18} />Réservations</Link>
        <Link href="/crm/forfaits" aria-current={active === "packages" ? "page" : undefined} className={itemClass(active === "packages")}><WalletCards size={18} />Forfaits</Link>
        <Link href="/crm/encaissements" aria-current={active === "cash" ? "page" : undefined} className={itemClass(active === "cash")}><CreditCard size={18} />Encaissements</Link>
        <Link href="/crm/clientes" aria-current={active === "clients" ? "page" : undefined} className={itemClass(active === "clients")}><UsersRound size={18} />Clientes</Link>
        <Link href="/crm/acces" aria-current={active === "access" ? "page" : undefined} className={itemClass(active === "access")}><KeyRound size={18} />Gestion des accès</Link>
      </nav>
    </aside>
    <div className="min-w-0 flex-1 flex flex-col">
      <CrmHeader centerId={centerId} />
      <main className="mx-auto max-w-6xl w-full space-y-7 px-4 py-8 sm:px-7 flex-1">{children}</main>
    </div>
  </div>;
}
