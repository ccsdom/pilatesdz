import { validateLocalFirebase } from "./firebase-local";
import { validateCloudFirebase, validateCloudWeb } from "./firebase-cloud";

export function getClientFirebaseConfig() {
  // Explicit accesses allow Next to inline only these public parameters.
  const input = {
    enabled: process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    nodeEnv: process.env.NODE_ENV,
    authHost: process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST,
    firestoreHost: process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST,
    storageHost: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST,
  };
  if (input.enabled === "false") return {
    ...validateCloudFirebase(input),
    ...validateCloudWeb({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    }),
  };
  return { mode: "local" as const, ...validateLocalFirebase(input) };
}
