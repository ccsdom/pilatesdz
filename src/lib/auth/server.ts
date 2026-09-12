import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { firestoreMemberships } from "@/repositories/firestore/memberships";
import { createAuthService } from "@/services/auth-service";
import { AccessError } from "@/domain/models/access";

export const SESSION_COOKIE = "pilates_session";

function invalidCredential(error: unknown): never {
  const code = (error as { code?: string })?.code;
  if (["auth/argument-error", "auth/invalid-id-token", "auth/id-token-expired", "auth/id-token-revoked",
    "auth/invalid-session-cookie", "auth/session-cookie-expired", "auth/session-cookie-revoked",
    "auth/user-disabled", "auth/user-not-found"].includes(code ?? "")) throw new AccessError(401);
  throw error;
}

export function getAuthService() {
  const { auth, firestore } = getFirebaseAdmin();
  const centerId = process.env.CENTER_ID;
  if (!centerId || !/^[a-z0-9-]+$/.test(centerId)) throw new Error("Centre non configuré.");
  const sessionRef = (cookie: string) => {
    if (!/^[a-f0-9]{64}$/.test(cookie)) throw new AccessError(401);
    return firestore.doc(`authSessions/${createHash("sha256").update(cookie).digest("hex")}`);
  };
  return createAuthService({
    async verifyIdToken(token) {
      try { const user = await auth.verifyIdToken(token, true); return { uid: user.uid, authTime: user.auth_time }; }
      catch (error) { return invalidCredential(error); }
    },
    async verifySession(cookie) {
      const record = (await sessionRef(cookie).get()).data();
      if (!record || typeof record.expiresAt !== "number" || record.expiresAt <= Date.now() || typeof record.firebaseCookie !== "string") throw new AccessError(401);
      try {
        const user = await auth.verifySessionCookie(record.firebaseCookie, true);
        if (user.uid !== record.uid) throw new AccessError(401);
        return { uid: user.uid, authTime: user.auth_time };
      }
      catch (error) { return invalidCredential(error); }
    },
    async createSession(token, expiresIn) {
      const firebaseCookie = await auth.createSessionCookie(token, { expiresIn });
      const user = await auth.verifySessionCookie(firebaseCookie, true);
      const cookie = randomBytes(32).toString("hex");
      await sessionRef(cookie).create({ uid: user.uid, firebaseCookie, expiresAt: Date.now() + expiresIn });
      return cookie;
    },
    async revokeSessions(uid, cookie) {
      // Immediate removal avoids Firebase's second-granularity revocation race.
      await sessionRef(cookie).delete();
      await auth.revokeRefreshTokens(uid);
    },
  }, firestoreMemberships(firestore), centerId);
}
