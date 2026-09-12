import "server-only";
import { validateLocalFirebase } from "./firebase-local";

export function getServerFirebaseConfig() {
  return validateLocalFirebase({
    enabled: process.env.FIREBASE_USE_EMULATORS,
    projectId: process.env.FIREBASE_PROJECT_ID,
    nodeEnv: process.env.NODE_ENV,
    authHost: process.env.FIREBASE_AUTH_EMULATOR_HOST,
    firestoreHost: process.env.FIRESTORE_EMULATOR_HOST,
    storageHost: process.env.FIREBASE_STORAGE_EMULATOR_HOST,
  });
}
