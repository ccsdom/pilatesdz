import "server-only";
import { type Firestore, type Transaction } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import { z } from "zod";

export const auditLogSchema = z.object({
  id: z.string().uuid(),
  centerId: z.string().min(1),
  actorUid: z.string().min(1),
  action: z.string().min(1).max(100),
  targetType: z.string().min(1).max(50),
  targetId: z.string().min(1).max(100),
  timestamp: z.number().int().nonnegative(),
  details: z.record(z.unknown()).optional(),
}).strip();

export type AuditLogEntry = z.infer<typeof auditLogSchema>;

export function auditLogRepository(db: Firestore, now = Date.now) {
  return {
    /**
     * Records an immutable audit log entry within an existing Firestore transaction.
     */
    recordInTransaction(
      tx: Transaction,
      centerId: string,
      entry: Omit<AuditLogEntry, "id" | "timestamp" | "centerId">
    ): AuditLogEntry {
      const id = randomUUID();
      const timestamp = now();
      const record: AuditLogEntry = {
        id,
        centerId,
        actorUid: entry.actorUid,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        timestamp,
        details: entry.details,
      };

      const ref = db.collection("centers").doc(centerId).collection("audit_logs").doc(id);
      tx.create(ref, record);
      return record;
    },

    /**
     * Records an immutable audit log entry asynchronously outside a transaction.
     */
    async record(
      centerId: string,
      entry: Omit<AuditLogEntry, "id" | "timestamp" | "centerId">
    ): Promise<AuditLogEntry> {
      const id = randomUUID();
      const timestamp = now();
      const record: AuditLogEntry = {
        id,
        centerId,
        actorUid: entry.actorUid,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        timestamp,
        details: entry.details,
      };

      const ref = db.collection("centers").doc(centerId).collection("audit_logs").doc(id);
      await ref.create(record);
      return record;
    },
  };
}
