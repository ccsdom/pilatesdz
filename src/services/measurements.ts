import { AccessError, type Access } from "@/domain/models/access";
import { clientIdSchema } from "@/domain/models/client";
import { measurementDaySchema, measurementInputSchema, isMeasurementDayAllowed } from "@/domain/models/measurements";
import { ManagementError } from "@/domain/ports/access-management";
import type { MeasurementRepository } from "@/domain/ports/measurements";
export function createMeasurementService(repository: MeasurementRepository) {
  function authorize(actor: Access, id: string) {
    if (actor.role !== "admin") throw new AccessError(403);
    if (!clientIdSchema.safeParse(id).success) throw new ManagementError(400, "Identifiant invalide.");
  }
  return {
    list(actor: Access, clientId: string, after?: string) {
      authorize(actor, clientId);
      if (after && !measurementDaySchema.safeParse(after).success) throw new ManagementError(400, "Curseur invalide.");
      return repository.list(actor, clientId, after);
    },
    save(actor: Access, clientId: string, input: unknown, version: number) {
      authorize(actor, clientId);
      const parsed = measurementInputSchema.safeParse(input);
      if (!parsed.success || !isMeasurementDayAllowed(parsed.data.day) || !Number.isSafeInteger(version) || version < 0) throw new ManagementError(400, "Vérifiez la date et les valeurs (positives, une décimale maximum). Les dates futures sont interdites.");
      return repository.save(actor, clientId, parsed.data, version);
    },
  };
}
