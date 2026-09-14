import type { Access } from "../models/access";
import type { OpenBalancePage } from "../models/open-balances";
export interface OpenBalanceRepository { list(actor: Access, after?: string): Promise<OpenBalancePage> }
