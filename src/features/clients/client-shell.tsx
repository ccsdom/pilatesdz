import Link from "next/link";
import { UsersRound, LayoutDashboard, KeyRound, CalendarDays } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { LogoutButton } from "@/features/auth/logout-button";

export function ClientShell({ centerId, children, active = "clients" }: { centerId: string; children: React.ReactNode; active?: "clients" | "planning" | "packages" | "cash" }) {
  const itemClass = (selected: boolean) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${selected ? "bg-[#b7893b] text-black" : "text-white/65 hover:bg-white/5"}`;
  return <div className="min-h-screen bg-[#f3eee5] text-[#1c1b19] lg:flex">
    <aside className="bg-[#080808] p-5 text-white lg:w-64 lg:shrink-0"><div className="border-b border-white/10 pb-5"><BrandLockup light compact /></div>
      <nav aria-label="Navigation CRM" className="mt-5 flex flex-wrap gap-2 lg:flex-col">
        <Link href="/crm" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/65 hover:bg-white/5"><LayoutDashboard size={18} />Tableau de bord</Link>
        <Link href="/crm/planning" aria-current={active === "planning" ? "page" : undefined} className={itemClass(active === "planning")}><CalendarDays size={18} />Planning</Link>
        <Link href="/crm/forfaits" aria-current={active === "packages" ? "page" : undefined} className={itemClass(active === "packages")}>Forfaits</Link>
        <Link href="/crm/encaissements" aria-current={active === "cash" ? "page" : undefined} className={itemClass(active === "cash")}>Encaissements</Link>
        <Link href="/crm/clientes" aria-current={active === "clients" ? "page" : undefined} className={itemClass(active === "clients")}><UsersRound size={18} />Clientes</Link>
        <Link href="/crm/acces" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/65 hover:bg-white/5"><KeyRound size={18} />Gestion des accès</Link>
      </nav>
    </aside>
    <div className="min-w-0 flex-1"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d9cdb9] bg-[#fbf8f2] px-6 py-5"><p className="text-sm text-[#746d63]">Administration · Centre {centerId}</p><LogoutButton /></header><main className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-7">{children}</main></div>
  </div>;
}
