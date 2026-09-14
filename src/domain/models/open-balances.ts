export function subscriptionBalance(amountDzd: unknown, paidMinor: unknown, paymentRecorded: unknown) {
  const total = typeof amountDzd === "number" ? amountDzd * 100 : NaN;
  const paid = paidMinor === undefined ? 0 : paidMinor;
  if (!Number.isSafeInteger(amountDzd) || !Number.isSafeInteger(total) || total <= 0
    || typeof paid !== "number" || !Number.isSafeInteger(paid) || paid < 0 || paid > total
    || (paymentRecorded !== undefined && typeof paymentRecorded !== "boolean")
    || (paymentRecorded === false && paid > 0)) throw new Error("Invalid subscription balance");
  return { totalMinor: total, paidMinor: paid, remainingMinor: total - paid,
    state: paid === total ? "settled" as const : paid > 0 ? "partial" as const : paymentRecorded === true ? "history" as const : "none" as const };
}
export type OpenBalance = ReturnType<typeof subscriptionBalance> & { clientId: string; name: string; active: boolean; subscriptionId: string; purchaseDate: string; offerId: "monthly-4" | "monthly-8"; term: "monthly" | "quarterly" };
export type OpenBalancePage = { scanned: number; rows: OpenBalance[]; remainingMinor: number; next: string | null };
