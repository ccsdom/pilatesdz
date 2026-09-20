import { z } from "zod";
import type { ClientProfile } from "./client";

export const directoryFiltersSchema = z.object({
  status: z.enum(["all", "active", "inactive"]).default("all"),
  contact: z.enum(["all", "phone", "missing-phone"]).default("all"),
});
export type DirectoryFilters = z.infer<typeof directoryFiltersSchema>;
export function matchesDirectory(client: ClientProfile, filters: DirectoryFilters) {
  return (filters.status === "all" || client.status === filters.status)
    && (filters.contact === "all" || (filters.contact === "phone" ? !!client.phone : !client.phone));
}

// Quote every cell and neutralize spreadsheet formulas, including phone prefixes.
export function clientsCsv(clients: ClientProfile[]) {
  const cell = (value: string) => `"${(/^[\s]*[=+@-]/.test(value) ? "'" : "") + value.replace(/"/g, '""')}"`;
  return "\uFEFF" + [["Nom", "E-mail", "Téléphone", "Statut"], ...clients.map(c => [c.name, c.email, c.phone, c.status === "active" ? "Active" : "Inactive"])].map(row => row.map(cell).join(";")).join("\r\n");
}
