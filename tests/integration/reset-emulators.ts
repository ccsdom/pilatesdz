// Each HTTP suite owns its fixtures. Corrupt-data and overlap scenarios must
// never leak into the next suite. Files run sequentially in vitest.auth.config.
async function resetEmulators() {
  if (process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8082" ||
      process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9098") {
    throw new Error("Refusing reset outside the dedicated local test emulators");
  }
  const endpoints = [
    "http://127.0.0.1:8082/emulator/v1/projects/demo-pilates-center-alger/databases/(default)/documents",
    "http://127.0.0.1:9098/emulator/v1/projects/demo-pilates-center-alger/accounts",
  ];
  for (const endpoint of endpoints) {
    const response = await fetch(endpoint, { method: "DELETE" });
    if (!response.ok) throw new Error(`Test emulator reset failed: ${response.status}`);
  }
}

await resetEmulators();
export {};
