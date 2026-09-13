import type { Access } from "../models/access";
import type { PaymentCorrection, PaymentCorrectionInput, PaymentInput, PaymentPage, PaymentRecord } from "../models/payment";
export interface PaymentRepository {
  correct(actor: Access, clientId: string, subscriptionId: string, requestId: string, correction: PaymentCorrectionInput): Promise<PaymentCorrection>;
  list(actor: Access, clientId: string, subscriptionId: string, after?: string): Promise<PaymentPage>;
  record(actor: Access, clientId: string, subscriptionId: string, requestId: string, payment: PaymentInput): Promise<PaymentRecord>;
}
