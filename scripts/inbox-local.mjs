import { writeFile } from "node:fs/promises";
import { localEnv } from "./local-env.mjs";

if (process.env.NODE_ENV === "production") throw new Error("Local demo only.");
const env = localEnv();
const response = await fetch(`http://${env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${env.FIREBASE_PROJECT_ID}/oobCodes`, { signal: AbortSignal.timeout(5000) });
if (!response.ok) throw new Error("Local authentication emulator unavailable.");
const { oobCodes = [] } = await response.json();
const messages = oobCodes.filter((item) => item.requestType === "PASSWORD_RESET").map((item) => ({
  email: item.email,
  url: `${env.APP_ORIGIN}/connexion/mot-de-passe#${new URLSearchParams({ oobCode: item.oobCode })}`,
}));
// Runtime bearer links belong only in this ignored, local demo file.
await writeFile(new URL("../.firebase/boite-reception.json", import.meta.url), JSON.stringify(messages, null, 2) + "\n");
console.log(`${messages.length} lien(s) de test dans .firebase/boite-reception.json. Certains peuvent être déjà utilisés ou expirés. Aucun e-mail envoyé.`);
