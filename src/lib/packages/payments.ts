import "server-only";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { paymentsRepository } from "@/repositories/firestore/payments";
import { createPaymentService } from "@/services/payments";
export function getPaymentService() { return createPaymentService(paymentsRepository(getFirebaseAdmin().firestore)); }
