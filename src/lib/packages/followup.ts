import "server-only";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { packageFollowupRepository } from "@/repositories/firestore/package-followup";
import { createPackageFollowupService } from "@/services/package-followup";
export function getPackageFollowupService() { return createPackageFollowupService(packageFollowupRepository(getFirebaseAdmin().firestore)); }
