export const CLOUD_PROJECT_ID = "pilates-center-9dee6";

export function validateCloudFirebase(input: {
  enabled?: string; projectId?: string; authHost?: string;
  firestoreHost?: string; storageHost?: string;
}) {
  if (input.enabled !== "false" || input.projectId !== CLOUD_PROJECT_ID) {
    throw new Error("Firebase cloud exige le projet PILATES CENTER et des émulateurs désactivés explicitement.");
  }
  if (input.authHost || input.firestoreHost || input.storageHost) {
    throw new Error("Configuration Firebase mixte cloud/émulateur interdite.");
  }
  return { mode: "cloud" as const, projectId: CLOUD_PROJECT_ID };
}

export function validateCloudWeb(input: { apiKey?: string; appId?: string; authDomain?: string; storageBucket?: string }) {
  if (!input.apiKey || input.appId !== "1:736869698241:web:71bb6d30d3610cfb642240"
    || input.authDomain !== `${CLOUD_PROJECT_ID}.firebaseapp.com`
    || input.storageBucket !== `${CLOUD_PROJECT_ID}.firebasestorage.app`) {
    throw new Error("Configuration publique Firebase PILATES CENTER incomplète ou incorrecte.");
  }
  return { apiKey: input.apiKey, appId: input.appId, authDomain: input.authDomain, storageBucket: input.storageBucket };
}
