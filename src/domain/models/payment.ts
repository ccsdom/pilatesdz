import { z } from "zod";
import { subscriptionInputSchema } from "./subscription";

export const paymentInputSchema = z.object({
  amountMinor: z.number().int().positive().safe(),
  receivedDate: subscriptionInputSchema.shape.purchaseDate,
  method: z.literal("cash"),
}).strict();
export type PaymentInput = z.infer<typeof paymentInputSchema>;
export const paymentCorrectionSchema = z.object({
  paymentId: z.string().uuid(), reason: z.string().trim().min(5).max(300),
}).strict();
export type PaymentCorrectionInput = z.infer<typeof paymentCorrectionSchema>;
export type PaymentCorrection = PaymentCorrectionInput & { id: string; recordedAt: number; amountMinor: number };
export type PaymentRecord = PaymentInput & { id: string; recordedAt: number; correction?: { id: string; reason: string; recordedAt: number } };
export type PaymentPage = {
  clientId: string; subscriptionId: string; totalMinor: number; paidMinor: number; purchaseDate: string;
  payments: PaymentRecord[]; next: string | null;
};

export function parseCashAmount(value: string): number | null {
  if (!/^\d{1,12}([.,]\d{1,2})?$/.test(value.trim())) return null;
  const [whole, fraction = ""] = value.trim().replace(",", ".").split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}
export function formatCashAmount(amountMinor: number) {
  return new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD", minimumFractionDigits: 2 }).format(amountMinor / 100);
}
