import "server-only";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { getAccountProvisioner } from "@/lib/auth/access-management";
import { clientRepository } from "@/repositories/firestore/clients";
import { createClientService } from "@/services/clients";

export function getClientService() {
  return createClientService(clientRepository(getFirebaseAdmin().firestore), getAccountProvisioner());
}
