// Commercial terms confirmed by the centre on 12 September 2026.
// Amounts are whole Algerian dinars, not payment records.
export const COURSE_DURATION_MINUTES = 60;
export const COURSE_MAX_CAPACITY = 4;
export const QUARTERLY_DISCOUNT_PERCENT = 20;
export const SINGLE_SESSION_OFFERS = [
  { id: "discovery", label: "Séance découverte", priceDzd: 2500 },
  { id: "single", label: "Séance libre", priceDzd: 3500 },
] as const;
export const MONTHLY_OFFERS = [
  { id: "monthly-4", sessionsPerMonth: 4, priceDzd: 12000 },
  { id: "monthly-8", sessionsPerMonth: 8, priceDzd: 20000 },
] as const;
export function quarterlyPrice(monthlyPriceDzd: number) {
  if (!Number.isSafeInteger(monthlyPriceDzd) || monthlyPriceDzd < 0) throw new Error("Tarif mensuel invalide.");
  return Math.round(monthlyPriceDzd * 3 * (100 - QUARTERLY_DISCOUNT_PERCENT) / 100);
}
export function formatDzd(amount: number) {
  return `${new Intl.NumberFormat("fr-DZ").format(amount)} DA`;
}
