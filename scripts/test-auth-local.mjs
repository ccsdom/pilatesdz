import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { localEnv } from "./local-env.mjs";

// Refuse to reuse an unrelated server on the test port.
const probe = createServer();
await new Promise((resolve, reject) => { probe.once("error", reject); probe.listen(3102, "127.0.0.1", resolve); });
await new Promise((resolve) => probe.close(resolve));
const env = { ...process.env, ...localEnv(3102, true), PILATES_AUTH_TEST: "true", AUTH_TEST_ORIGIN: "http://127.0.0.1:3102" };
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3102"], { env, stdio: "inherit" });
try {
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt++) {
    if (server.exitCode !== null) throw new Error("Next test server stopped.");
    try { const response = await fetch(env.AUTH_TEST_ORIGIN, { signal: AbortSignal.timeout(1500) }); ready = response.ok; } catch {}
    if (ready) break;
    await delay(1000);
  }
  if (!ready) throw new Error("Next test server not ready.");
  const tests = spawn(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "--config", "vitest.auth.config.ts"], { env, stdio: "inherit" });
  process.exitCode = await new Promise((resolve, reject) => { tests.on("error", reject); tests.on("exit", (code) => resolve(code ?? 1)); });
} finally {
  if (server.pid && server.exitCode === null) {
    if (process.platform === "win32") {
      const stop = spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
      await new Promise((resolve) => stop.on("exit", resolve));
    } else { server.kill("SIGTERM"); await new Promise((resolve) => server.on("exit", resolve)); }
  }
}
