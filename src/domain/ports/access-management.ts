import type { Access } from "@/domain/models/access";

export type ClientAccess = { uid: string; email: string; name: string; active: boolean; clientId?: string };
export class ManagementError extends Error {
  constructor(public readonly status: 400 | 404 | 409, message: string) { super(message); }
}
export interface AccountProvisioner {
  create(email: string, name: string, uid?: string): Promise<string>;
  invitation(email: string): Promise<string>;
}
export interface AccessRepository {
  add(actor: Access, member: ClientAccess): Promise<void>;
  find(actor: Access, uid: string): Promise<ClientAccess>;
  deactivate(actor: Access, uid: string): Promise<void>;
}
