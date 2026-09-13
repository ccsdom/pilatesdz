import { z } from "zod";
import { parseStudioDateTime } from "./planning";
import { MONTHLY_OFFERS, quarterlyPrice } from "./studio-offers";
import type { PackageInput } from "./package";

export const subscriptionInputSchema = z.object({
  offerId: z.enum(["monthly-4", "monthly-8"]),
  term: z.enum(["monthly", "quarterly"]),
  purchaseDate: z.string().regex(/^20\d{2}-\d{2}-\d{2}$/).refine(value => {
    try { parseStudioDateTime(`${value}T00:00`); return true; } catch { return false; }
  }, "Date d’achat invalide."),
}).strict();
export type SubscriptionInput = z.infer<typeof subscriptionInputSchema>;
export type SubscriptionPlan = SubscriptionInput & {
  amountDzd: number; currency: "DZD"; pricingVersion: "2026-09-12";
  periods: PackageInput[];
};
// Each boundary uses the original purchase day: Jan 31 → Feb 28 → Mar 31.
// Shorter months clamp to their last day; subsequent months keep the anniversary.
function anniversary(date: string, offset: number) {
  const [year, month, day] = date.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + offset, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  const value = `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
  return parseStudioDateTime(`${value}T00:00`);
}
export function planSubscription(value: SubscriptionInput): SubscriptionPlan {
  const input = subscriptionInputSchema.parse(value);
  const offer = MONTHLY_OFFERS.find(offer => offer.id === input.offerId)!;
  const months = input.term === "quarterly" ? 3 : 1;
  return {
    ...input, amountDzd: months === 3 ? quarterlyPrice(offer.priceDzd) : offer.priceDzd,
    currency: "DZD", pricingVersion: "2026-09-12",
    periods: Array.from({ length: months }, (_, index) => ({
      label: `${offer.sessionsPerMonth} séances / mois — ${months === 3 ? `trimestre, mois ${index + 1}/3` : "mensuel"}`,
      credits: offer.sessionsPerMonth,
      validFrom: anniversary(input.purchaseDate, index),
      expiresAt: anniversary(input.purchaseDate, index + 1),
    })),
  };
}
