import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({ resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } }, test: {
  environment: "node", include: ["tests/integration/**/*.test.ts"],
  setupFiles: ["tests/integration/reset-emulators.ts"],
  fileParallelism: false, testTimeout: 60000, hookTimeout: 60000,
} });
