import "server-only";

import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getServerFirebaseConfig } from "@/config/env.server";

// Call only from Node.js server entry points after authorization is implemented.
// Admin bypasses security rules; this initializer grants no user permission.
export function getFirebaseAdmin() {
  const config = getServerFirebaseConfig();
  // This adapter is emulator-only: do not probe a GCP metadata server.
  process.env.METADATA_SERVER_DETECTION = "none";
  const app = getApps().find((app) => app.name === "pilates-local") ?? initializeApp({
    projectId: config.projectId,
    storageBucket: `${config.projectId}.appspot.com`,
  }, "pilates-local");
  return { auth: getAuth(app), firestore: getFirestore(app), storage: getStorage(app) };
}
