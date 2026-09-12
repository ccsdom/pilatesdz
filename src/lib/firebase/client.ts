"use client";

import { getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { getClientFirebaseConfig } from "@/config/env.client";

// Lazy: the public site needs neither a Firebase account nor environment values.
export function getFirebaseClient() {
  if (typeof window === "undefined") throw new Error("SDK Firebase navigateur uniquement.");
  const config = getClientFirebaseConfig();
  const existing = getApps().find((app) => app.name === "pilates-local");
  const app = existing ?? initializeApp({
    projectId: config.projectId,
    apiKey: "demo-api-key",
    appId: "demo-app-id",
    storageBucket: `${config.projectId}.appspot.com`,
  }, "pilates-local");
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app);
  if (!existing) {
    connectAuthEmulator(auth, `http://${config.auth.host}:${config.auth.port}`);
    connectFirestoreEmulator(firestore, config.firestore.host, config.firestore.port);
    connectStorageEmulator(storage, config.storage.host, config.storage.port);
  }
  return { auth, firestore, storage };
}
