import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { createAccessManagement } from "@/services/access-management";
import { accessRepository } from "@/repositories/firestore/access-management";
import { ManagementError, type AccountProvisioner } from "@/domain/ports/access-management";
import { isTrustedMutation } from "./request-policy";
import { getServerFirebaseConfig } from "@/config/env.server";
import { createPasswordEmailSender } from "@/services/password-email";

export function getAccessManagement() {
  return createAccessManagement(getAccountProvisioner(), accessRepository(getFirebaseAdmin().firestore));
}

export function getAccountProvisioner(): AccountProvisioner {
  const cloud = getServerFirebaseConfig().mode === "cloud";
  const { auth, firestore } = getFirebaseAdmin();
  const sendEmail = createPasswordEmailSender({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    request: fetch,
    async reserve(email) {
      const ref = firestore.doc(`authInvitationLimits/${createHash("sha256").update(email.toLowerCase()).digest("hex")}`);
      await firestore.runTransaction(async tx => {
        const previous = (await tx.get(ref)).data();
        const now = Date.now();
        if (typeof previous?.requestedAt === "number" && now - previous.requestedAt < 60000) {
          throw new ManagementError(409, "Patientez une minute avant de renvoyer une invitation à cette adresse.");
        }
        tx.set(ref, { requestedAt: now });
      });
    },
  });
  const origin = process.env.APP_ORIGIN;
  if (!isTrustedMutation(origin ?? null, "application/json", origin)) throw new Error("Invalid local origin");
  return {
    async create(email, name, uid) {
      if (cloud && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) throw new ManagementError(409, "Envoi Firebase non configuré.");
      try {
        return (await auth.createUser({ ...(uid ? { uid } : {}), email, displayName: name, password: randomBytes(32).toString("base64url"), emailVerified: false })).uid;
      } catch (error) {
        if (["auth/email-already-exists", "auth/uid-already-exists"].includes((error as { code?: string }).code ?? "")) {
          if (uid) {
            try {
              const existing = await auth.getUser(uid);
              if (existing.email?.toLowerCase() === email && !existing.disabled) return uid;
            } catch (lookupError) { if ((lookupError as { code?: string }).code !== "auth/user-not-found") throw lookupError; }
          }
          throw new ManagementError(409, "Cette adresse possède déjà un compte. Aucun accès n’a été modifié.");
        }
        throw error;
      }
    },
    async invitation(email) {
      if (!email) throw new ManagementError(409, "Ce compte de démonstration ne possède pas d’adresse enregistrée dans le centre.");
      if (cloud) return sendEmail(email);
      const firebaseUrl = new URL(await auth.generatePasswordResetLink(email));
      const code = firebaseUrl.searchParams.get("oobCode");
      if (!code) throw new Error("Missing action code");
      // Local preview only. Production must deliver this bearer link to the recipient privately.
      const url = new URL("/connexion/mot-de-passe", origin);
      url.hash = new URLSearchParams({ oobCode: code }).toString();
      return url.toString();
    },
  };
}
