import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const mode = process.argv[2];
if (!["start", "test", "auth-test"].includes(mode)) throw new Error("Expected start, test or auth-test.");
// Keep downloaded emulator binaries and CLI state in this checkout.
const cache = resolve(".firebase/cache");
mkdirSync(cache, { recursive: true });
const args = ["node_modules/firebase-tools/lib/bin/firebase.js", mode === "start" ? "emulators:start" : "emulators:exec",
  "--project", "demo-pilates-center-alger", "--config", mode === "start" ? "firebase.json" : "firebase.test.json", "--only", "auth,firestore,storage"];
if (mode === "test") args.push("node node_modules/vitest/vitest.mjs run --config vitest.security.config.ts");
if (mode === "auth-test") args.push("node scripts/test-auth-local.mjs");
const child = spawn(process.execPath, args, {
  stdio: "inherit",
  env: { ...process.env, FIREBASE_EMULATORS_PATH: cache, XDG_CONFIG_HOME: resolve(".firebase/config"), CI: "true" },
});
child.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
