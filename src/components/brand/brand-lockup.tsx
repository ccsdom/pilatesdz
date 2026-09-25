import Image from "next/image";
import s from "./brand-lockup.module.css";

export function Lotus({ className = "h-9 w-9" }: { className?: string }) {
  return <svg viewBox="0 0 80 58" className={className} fill="none" aria-hidden="true"><g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M40 49C28 38 27 22 40 6c13 16 12 32 0 43Z"/><path d="M37 47C22 43 14 32 14 18c14 2 24 11 27 25"/><path d="M43 47c15-4 23-15 23-29-14 2-24 11-27 25"/><path d="M35 49C22 52 10 48 4 39c11-6 24-5 33 5"/><path d="M45 49c13 3 25-1 31-10-11-6-24-5-33 5"/></g></svg>;
}

export function BrandLockup({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return <div className={[s.brand, compact ? s.compact : "", light ? s.light : ""].join(" ")}>
    <div className={s.crop}><Image src="/brand/pilates-dz-logo-transparent.png" alt="PILATES DZ — Sculptfit center" width={1536} height={1024} unoptimized loading="eager" className={s.image}/></div>
  </div>;
}
