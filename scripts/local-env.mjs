export function localEnv(port = 3100, testing = false) {
  const authHost = `127.0.0.1:${testing ? 9098 : 9099}`;
  const firestoreHost = `127.0.0.1:${testing ? 8082 : 8080}`;
  const storageHost = `127.0.0.1:${testing ? 9198 : 9199}`;
  return {
    METADATA_SERVER_DETECTION: "none",
    NEXT_TELEMETRY_DISABLED: "1",
    FIREBASE_USE_EMULATORS: "true", FIREBASE_PROJECT_ID: "demo-pilates-center-alger",
    FIREBASE_AUTH_EMULATOR_HOST: authHost, FIRESTORE_EMULATOR_HOST: firestoreHost,
    FIREBASE_STORAGE_EMULATOR_HOST: storageHost, CENTER_ID: "alger", APP_ORIGIN: `http://127.0.0.1:${port}`,
    NEXT_PUBLIC_FIREBASE_USE_EMULATORS: "true", NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-pilates-center-alger",
    NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: authHost, NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST: firestoreHost,
    NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST: storageHost,
  };
}
