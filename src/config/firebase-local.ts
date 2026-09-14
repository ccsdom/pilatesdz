// Pure validation of the isolated demo environment. Cloud uses a separate validator.
export const DEMO_PROJECT_ID = "demo-pilates-center-alger";

export function validateLocalFirebase(input: {
  enabled?: string;
  projectId?: string;
  nodeEnv?: string;
  authHost?: string;
  firestoreHost?: string;
  storageHost?: string;
}) {
  if (input.enabled !== "true" || input.projectId !== DEMO_PROJECT_ID) {
    throw new Error("Firebase exige un mode émulateur explicite et le projet de démonstration.");
  }
  const parseHost = (value: string | undefined) => {
    const match = /^(127\.0\.0\.1|localhost):([0-9]{1,5})$/.exec(value ?? "");
    if (!match || Number(match[2]) < 1 || Number(match[2]) > 65535) {
      throw new Error("Chaque émulateur exige une adresse loopback et un port valide.");
    }
    return { host: match[1], port: Number(match[2]) };
  };
  return {
    projectId: DEMO_PROJECT_ID,
    auth: parseHost(input.authHost),
    firestore: parseHost(input.firestoreHost),
    storage: parseHost(input.storageHost),
  };
}
