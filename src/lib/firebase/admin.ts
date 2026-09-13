import "server-only";

import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getServerFirebaseConfig } from "@/config/env.server";

// Call only from Node.js server entry points after authorization is implemented.
// Admin bypasses security rules; this initializer grants no user permission.
export function getFirebaseAdmin() {
  const config = getServerFirebaseConfig();
  if (config.mode === "local") process.env.METADATA_SERVER_DETECTION = "none";
  const name = `pilates-${config.mode}`;
  const app = getApps().find((app) => app.name === name) ?? initializeApp({
    projectId: config.projectId,
    storageBucket: `${config.projectId}.${config.mode === "local" ? "appspot.com" : "firebasestorage.app"}`,
    ...(config.mode === "cloud" ? { credential: applicationDefault() } : {}),
  }, name);
  return { auth: getAuth(app), firestore: getFirestore(app), storage: getStorage(app) };
}
