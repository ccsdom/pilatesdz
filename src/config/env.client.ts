import { validateLocalFirebase } from "./firebase-local";

export function getClientFirebaseConfig() {
  // Explicit accesses allow Next to inline only these public parameters.
  return validateLocalFirebase({
    enabled: process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    nodeEnv: process.env.NODE_ENV,
    authHost: process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST,
    firestoreHost: process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST,
    storageHost: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST,
  });
}
