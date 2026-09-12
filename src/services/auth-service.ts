import { AccessError, type Access, type CenterRole } from "@/domain/models/access";
import type { AuthGateway, MembershipRepository } from "@/domain/ports/auth";
import { belongsToCenter } from "@/domain/policies/center-access";

export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export function createAuthService(auth: AuthGateway, memberships: MembershipRepository, centerId: string, now = Date.now) {
  async function accessFor(uid: string, allowed: readonly CenterRole[]): Promise<Access> {
    const membership = await memberships.find(uid, centerId);
    if (!membership || !belongsToCenter(uid, centerId, membership) || !allowed.includes(membership.role)) {
      throw new AccessError(403);
    }
    return { uid, centerId, role: membership.role };
  }
  return {
    async login(token: string) {
      const identity = await auth.verifyIdToken(token);
      const age = now() / 1000 - identity.authTime;
      if (!Number.isFinite(age) || age < -30 || age > 300) throw new AccessError(401);
      const access = await accessFor(identity.uid, ["client", "admin"]);
      const cookie = await auth.createSession(token, SESSION_DURATION_MS);
      return { cookie, access };
    },
    async authorize(cookie: string | undefined, roles: readonly CenterRole[]) {
      if (!cookie) throw new AccessError(401);
      const identity = await auth.verifySession(cookie);
      // No shared cache: role or membership changes take effect on the next request.
      return accessFor(identity.uid, roles);
    },
    async logout(cookie: string | undefined) {
      if (!cookie) return;
      let identity;
      try { identity = await auth.verifySession(cookie); }
      catch (error) { if (error instanceof AccessError) return; throw error; }
      await auth.revokeSessions(identity.uid, cookie);
    },
  };
}
