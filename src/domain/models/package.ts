import { z } from "zod";
import { dayRange } from "./planning";

export const packageInputSchema = z.object({
  label: z.string().trim().min(1).max(80),
  credits: z.number().int().min(1).max(100),
  validFrom: z.number().int().nonnegative(),
  expiresAt: z.number().int().positive(),
}).strict().refine((value) => value.expiresAt > value.validFrom && value.expiresAt - value.validFrom <= 366 * 86400000, "Validité maximale : 366 jours.");
export type PackageInput = z.infer<typeof packageInputSchema>;
export type CreditPackage = PackageInput & { id: string; centerId: string; clientId: string; remaining: number; assignedAt: number };
export type PackagePage = { packages: CreditPackage[]; next: string | null; clientId: string };
export function packageDates(first: string, last: string) { return { validFrom: dayRange(first).start, expiresAt: dayRange(last).end }; }
export function canUsePackage(pack: CreditPackage, startsAt: number) { return pack.remaining > 0 && pack.validFrom <= startsAt && startsAt < pack.expiresAt; }
export function selectPackage(packs: CreditPackage[], startsAt: number) {
  return packs.filter((pack) => canUsePackage(pack, startsAt)).sort((a, b) => a.expiresAt - b.expiresAt || a.id.localeCompare(b.id))[0];
}
