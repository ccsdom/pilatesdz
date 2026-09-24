import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import type { MembershipRepository } from "@/domain/ports/auth";
import type { Membership } from "@/domain/models/access";

export function firestoreMemberships(db: Firestore): MembershipRepository {
  return {
    async find(uid, centerId) {
      // Defense in depth before constructing a document path.
      if (!uid || uid.includes("/") || !/^[a-z0-9-]+$/.test(centerId)) return null;
      const snapshot = await db.doc(`centers/${centerId}/members/${uid}`).get();
      if (!snapshot.exists) return null;
      const data = snapshot.data();
      if (!data || data.centerId !== centerId || data.uid !== uid || typeof data.active !== "boolean" ||
          (data.role !== "client" && data.role !== "admin" && data.role !== "manager")) return null;
      return { uid, centerId, active: data.active, role: data.role } satisfies Membership;
    },
  };
}
