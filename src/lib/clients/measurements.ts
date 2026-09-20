import "server-only";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { measurementRepository } from "@/repositories/firestore/measurements";
import { createMeasurementService } from "@/services/measurements";
export function getMeasurementService() { return createMeasurementService(measurementRepository(getFirebaseAdmin().firestore)); }
