import type { Access } from "@/domain/models/access";

export type ClientAccess = { uid: string; email: string; name: string; active: boolean; clientId?: string; role?: "client" | "manager" };
export class ManagementError extends Error {
  constructor(public readonly status: 400 | 404 | 409, message: string) { super(message); }
}
export interface AccountProvisioner {
  create(email: string, name: string, uid?: string): Promise<string>;
  // Local demo URL, or null when Firebase accepted a private email delivery.
  invitation(email: string): Promise<string | null>;
}
export interface AccessRepository {
  add(actor: Access, member: ClientAccess): Promise<void>;
  find(actor: Access, uid: string): Promise<ClientAccess>;
  deactivate(actor: Access, uid: string): Promise<void>;
  reactivate(actor: Access, uid: string): Promise<void>;
  reserveManager(actor: Access, email: string, name: string): Promise<string>;
  addManager(actor: Access, uid: string): Promise<void>;
}
