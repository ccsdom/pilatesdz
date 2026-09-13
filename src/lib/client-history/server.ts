import "server-only";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { clientHistoryRepository } from "@/repositories/firestore/client-history";
import { createClientHistoryService } from "@/services/client-history";
export function getClientHistoryService() { return createClientHistoryService(clientHistoryRepository(getFirebaseAdmin().firestore)); }
