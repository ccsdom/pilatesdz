import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const port = process.env.PORT || "3101";
if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
  throw new Error("PORT doit être un entier compris entre 1 et 65535.");
}

// Public SDK config is downloaded with Firebase CLI; credentials stay outside Git.
const sdk = JSON.parse(readFileSync(new URL("../.firebase/firebase-cloud-config.json", import.meta.url), "utf8"));
if (sdk.projectId !== "pilates-center-9dee6") throw new Error("Projet cloud incorrect.");
const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS || fileURLToPath(new URL("../.firebase/server-adc.json", import.meta.url));
if (!existsSync(credentials)) {
  throw new Error("Configurez GOOGLE_APPLICATION_CREDENTIALS avec l’identité serveur approuvée avant de démarrer le mode cloud.");
}
const env = {
  ...process.env,
  GOOGLE_APPLICATION_CREDENTIALS: credentials,
  PILATES_CLOUD_DEV: "true",
  FIREBASE_USE_EMULATORS: "false",
  NEXT_PUBLIC_FIREBASE_USE_EMULATORS: "false",
  FIREBASE_PROJECT_ID: sdk.projectId,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: sdk.projectId,
  NEXT_PUBLIC_FIREBASE_API_KEY: sdk.apiKey,
  NEXT_PUBLIC_FIREBASE_APP_ID: sdk.appId,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: sdk.authDomain,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: sdk.storageBucket,
  CENTER_ID: "alger",
  APP_ORIGIN: `http://127.0.0.1:${port}`,
};
for (const key of ["FIREBASE_AUTH_EMULATOR_HOST", "FIRESTORE_EMULATOR_HOST", "FIREBASE_STORAGE_EMULATOR_HOST",
  "NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST", "NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST", "NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST"]) {
  // Empty values also prevent Next's .env loading from restoring a local host.
  env[key] = "";
}
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", port], { stdio: "inherit", env });
child.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
