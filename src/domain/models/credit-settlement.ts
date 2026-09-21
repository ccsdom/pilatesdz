import { z } from "zod";
import { clientIdSchema } from "./client";
import { ManagementError } from "../ports/access-management";

export type CreditState = "reserved" | "consumed" | "refunded";
export type CreditStatus = { state: CreditState; version: number; legacy: boolean };
export const settlementInput = z.object({ id: clientIdSchema, clientId: clientIdSchema, requestId: z.string().uuid(), version: z.number().int().min(0).max(1000000), state: z.enum(["consumed", "refunded"]), reason: z.string().trim().min(5).max(300) }).strict();
export type SettlementInput = z.infer<typeof settlementInput>;
export function creditStatus(booking: { creditPackageId?: unknown; creditState?: unknown; creditRefunded?: unknown; creditDecisionVersion?: unknown }): CreditStatus | null {
  if (!booking.creditPackageId) return null;
  if (!clientIdSchema.safeParse(booking.creditPackageId).success) throw new Error("Invalid credit package reference");
  const state = booking.creditState ?? (booking.creditRefunded === true ? "refunded" : "consumed");
  if (!["reserved", "consumed", "refunded"].includes(String(state))) throw new Error("Invalid credit state");
  const version = booking.creditDecisionVersion ?? 0;
  if (!Number.isSafeInteger(version) || Number(version) < 0) throw new Error("Invalid credit version");
  return { state: state as CreditState, version: Number(version), legacy: booking.creditState === undefined };
}
export function creditTransition(balance: { credits: number; remaining: number; reserved?: number }, from: CreditState, to: "consumed" | "refunded") {
  let remaining = balance.remaining, reserved = balance.reserved ?? 0;
  if (from !== to) {
    if (from === "reserved") reserved--;
    if (to === "refunded") remaining++;
    if (from === "refunded" && to === "consumed") remaining--;
  }
  if (![balance.credits, remaining, reserved].every(Number.isSafeInteger) || remaining < 0 || reserved < 0 || remaining + reserved > balance.credits) throw new ManagementError(409, "Solde insuffisant ou incohérent. Vérifiez le forfait avant de corriger.");
  return { remaining, reserved, consumed: balance.credits - remaining - reserved };
}
