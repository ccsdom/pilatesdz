import "server-only";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { attendanceRepository } from "@/repositories/firestore/attendance";
import { createAttendanceService } from "@/services/attendance";
export function getAttendanceService() { return createAttendanceService(attendanceRepository(getFirebaseAdmin().firestore)); }
