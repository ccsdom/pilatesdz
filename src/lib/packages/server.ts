import "server-only";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { packagesRepository } from "@/repositories/firestore/packages";
import { createPackageService } from "@/services/packages";
export function getPackageService() { return createPackageService(packagesRepository(getFirebaseAdmin().firestore)); }
