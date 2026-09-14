import type { Access } from "@/domain/models/access";
import type { PendingAttendanceReport } from "@/domain/models/attendance";
import type { PilatesSession, SessionInput, PlanningPage, SessionDetails } from "@/domain/models/planning";

export interface PlanningRepository {
  pendingAttendance(actor: Access, from: string, to: string): Promise<PendingAttendanceReport>;
  daySessions(actor: Access, day: string): Promise<PilatesSession[]>;
  create(actor: Access, id: string, input: SessionInput): Promise<PilatesSession>;
  list(actor: Access, day: string, after?: string): Promise<PlanningPage>;
  get(actor: Access, id: string): Promise<SessionDetails>;
  book(actor: Access, id: string, clientId?: string): Promise<void>;
  cancelBooking(actor: Access, id: string, clientId?: string): Promise<void>;
  cancelSession(actor: Access, id: string): Promise<void>;
}
