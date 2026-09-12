import type { Access } from "@/domain/models/access";
import type { ClientInput, ClientProfile, ClientPage, ClientDetails } from "@/domain/models/client";

export interface ClientRepository {
  create(actor: Access, input: ClientInput): Promise<ClientProfile>;
  update(actor: Access, id: string, version: number, input: ClientInput): Promise<ClientProfile>;
  get(actor: Access, id: string): Promise<ClientDetails>;
  list(actor: Access, search: string, after?: string): Promise<ClientPage>;
  reserveInvitation(actor: Access, id: string): Promise<ClientProfile>;
  releaseInvitation(actor: Access, id: string, uid: string): Promise<void>;
  link(actor: Access, id: string, uid: string): Promise<void>;
}
