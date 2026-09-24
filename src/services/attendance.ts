import { isCenterOperator } from "@/domain/models/access";
import { AccessError, type Access } from "@/domain/models/access";
import { clientIdSchema } from "@/domain/models/client";
import { attendanceInputSchema } from "@/domain/models/attendance";
import { ManagementError } from "@/domain/ports/access-management";
import type { AttendanceRepository } from "@/domain/ports/attendance";
export function createAttendanceService(repository: AttendanceRepository) {
  function admin(actor: Access) { if (!isCenterOperator(actor.role)) throw new AccessError(403); }
  return {
    mark(actor: Access, value: unknown) {
      admin(actor);
      const input = attendanceInputSchema.safeParse(value);
      if (!input.success) throw new ManagementError(400, "Vérifiez la présence et le motif de correction (5 caractères minimum).");
      return repository.mark(actor, input.data);
    },
    history(actor: Access, id: string, clientId: string, before?: number) {
      admin(actor);
      if (!clientIdSchema.safeParse(id).success || !clientIdSchema.safeParse(clientId).success || (before !== undefined && (!Number.isSafeInteger(before) || before < 1 || before > 1000000))) throw new ManagementError(400, "Historique invalide.");
      return repository.history(actor, id, clientId, before);
    },
  };
}
