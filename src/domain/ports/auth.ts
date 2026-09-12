import type { Identity, Membership } from "../models/access";

export interface AuthGateway {
  verifyIdToken(token: string): Promise<Identity>;
  verifySession(cookie: string): Promise<Identity>;
  createSession(token: string, expiresIn: number): Promise<string>;
  revokeSessions(uid: string, cookie: string): Promise<void>;
}

export interface MembershipRepository {
  find(uid: string, centerId: string): Promise<Membership | null>;
}
