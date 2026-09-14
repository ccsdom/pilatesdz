import "server-only";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { openBalanceRepository } from "@/repositories/firestore/open-balances";
import { createOpenBalanceService } from "@/services/open-balances";
export function getOpenBalanceService() { return createOpenBalanceService(openBalanceRepository(getFirebaseAdmin().firestore)); }
