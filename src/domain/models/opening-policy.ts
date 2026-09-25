import { z } from "zod";
import { studioOpeningSchema, defaultStudioOpening } from "./studio-opening";
import { bookingCalendarDate } from "./public-booking-calendar";
export const openingDateSchema = z.string().regex(/^20\d{2}-\d{2}-\d{2}$/).refine(day => {
  try { bookingCalendarDate(day); return true; } catch { return false; }
});
export const openingRevisionSchema = z.object({
  effectiveFrom: openingDateSchema, opening: studioOpeningSchema,
  version: z.number().int().positive(), updatedAt: z.number().int().positive(), updatedBy: z.string().min(1),
}).strict();
export const openingPolicySchema = z.object({ version: z.number().int().nonnegative(), revisions: z.array(openingRevisionSchema).max(100) }).strict().superRefine((value, ctx) => {
  if ((value.revisions.at(-1)?.version ?? 0) !== value.version || value.revisions.some((r, i) => i > 0 && (r.version <= value.revisions[i - 1].version || r.effectiveFrom < value.revisions[i - 1].effectiveFrom))) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Historique des horaires invalide." });
});
export type OpeningPolicy = z.infer<typeof openingPolicySchema>;
/** Firestore does not store arrays directly inside arrays: weekdays are a map. */
export function encodeOpeningPolicy(policy: OpeningPolicy) {
  return { ...policy, revisions: policy.revisions.map(revision => ({ ...revision, opening: { ...revision.opening, week: Object.fromEntries(revision.opening.week.map((ranges, day) => [String(day), ranges])) } })) };
}
export function decodeOpeningPolicy(raw: unknown): OpeningPolicy {
  const envelope = z.object({ version: z.number(), revisions: z.array(z.object({ opening: z.object({ week: z.record(z.unknown()) }).passthrough() }).passthrough()) }).strict().parse(raw);
  return openingPolicySchema.parse({ ...envelope, revisions: envelope.revisions.map(revision => {
    if (Object.keys(revision.opening.week).sort().join() !== "0,1,2,3,4,5,6") throw new Error("Semaine enregistrée invalide.");
    return { ...revision, opening: { ...revision.opening, week: Array.from({ length: 7 }, (_, day) => revision.opening.week[String(day)]) } };
  }) });
}
export const emptyOpeningPolicy = (): OpeningPolicy => ({ version: 0, revisions: [] });
export function openingForDay(policy: { revisions: Pick<OpeningPolicy["revisions"][number], "effectiveFrom" | "opening">[] }, day: string) {
  bookingCalendarDate(day);
  return policy.revisions.findLast(revision => revision.effectiveFrom <= day)?.opening ?? defaultStudioOpening();
}
