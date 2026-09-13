import type { Access } from "../models/access";
import type { PackageInput, PackagePage, CreditPackage } from "../models/package";
export interface PackageRepository {
  assign(actor: Access, clientId: string, id: string, input: PackageInput): Promise<CreditPackage>;
  list(actor: Access, clientId?: string, after?: string): Promise<PackagePage>;
}
