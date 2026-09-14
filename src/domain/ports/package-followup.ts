import type { Access } from "../models/access";
import type { PackageFollowupPage } from "../models/package-followup";
export interface PackageFollowupRepository { list(actor: Access, after?: string): Promise<PackageFollowupPage> }
