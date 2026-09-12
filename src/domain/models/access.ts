export type CenterRole = "client" | "admin";
export type Identity = { uid: string; authTime: number };
export type Membership = { uid: string; centerId: string; active: boolean; role: CenterRole };
export type Access = { uid: string; centerId: string; role: CenterRole };

export class AccessError extends Error {
  constructor(public readonly status: 401 | 403) {
    super(status === 401 ? "Connexion requise." : "Accès non autorisé à cet espace.");
  }
}
