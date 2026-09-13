import type { Access } from "../models/access";
import type { ClientHistoryPage } from "../models/client-history";
export interface ClientHistoryRepository { list(actor: Access, month: string, clientId?: string, after?: string): Promise<ClientHistoryPage> }
