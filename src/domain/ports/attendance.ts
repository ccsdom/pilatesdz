import type { Access } from "../models/access";
import type { Attendance, AttendanceInput, AttendanceEvent } from "../models/attendance";
export interface AttendanceRepository {
  mark(actor: Access, input: AttendanceInput): Promise<Attendance>;
  history(actor: Access, id: string, clientId: string, before?: number): Promise<{ events: AttendanceEvent[]; next: number | null }>;
}
