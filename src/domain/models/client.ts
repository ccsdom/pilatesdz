import { z } from "zod";

export const clientIdSchema = z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/);
export const clientInputSchema = z.object({
  name: z.string().trim().min(1, "Le nom est obligatoire.").max(100),
  email: z.string().trim().email("Adresse e-mail invalide.").max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(30).refine((value) => value === "" || (/^[+\d () .-]+$/.test(value) && /^\d{6,15}$/.test(value.replace(/\D/g, ""))), "Numéro de téléphone invalide."),
  status: z.enum(["active", "inactive"]),
}).strict();
export type ClientInput = z.infer<typeof clientInputSchema>;
export type ClientProfile = ClientInput & {
  id: string; centerId: string; authUid: string | null; invitationUid: string | null;
  version: number; createdAt: number; updatedAt: number;
};
export type ClientDetails = { profile: ClientProfile; access: "none" | "pending" | "active" | "disabled" };
export type ClientPage = { clients: ClientProfile[]; next: string | null };

export function normalizeSearch(value: string) {
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
  return /^[+\d () .-]+$/.test(normalized) ? normalized.replace(/\D/g, "") : normalized;
}
export function clientSearchPrefixes(input: ClientInput) {
  const name = normalizeSearch(input.name);
  const values = [name, ...name.split(/[\s'-]+/), normalizeSearch(input.email), input.phone.replace(/\D/g, "")];
  const prefixes = new Set<string>();
  for (const value of values) for (let length = 1; length <= value.length; length++) prefixes.add(value.slice(0, length));
  return [...prefixes];
}
