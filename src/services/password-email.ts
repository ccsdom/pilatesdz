import { ManagementError } from "@/domain/ports/access-management";

// A successful request means Firebase accepted delivery, not that the inbox received it.
export function createPasswordEmailSender(deps: {
  apiKey: string;
  reserve: (email: string) => Promise<void>;
  request: typeof fetch;
}) {
  return async (email: string): Promise<null> => {
    if (!deps.apiKey) throw new ManagementError(409, "Envoi Firebase non configuré.");
    await deps.reserve(email);
    try {
      const response = await deps.request(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(deps.apiKey)}`, {
        method: "POST", headers: { "Content-Type": "application/json", "X-Firebase-Locale": "fr" },
        body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error("Delivery refused");
      // Never return, store or log a response body or a password action code.
      return null;
    } catch {
      throw new ManagementError(409, "Envoi non confirmé. L’accès reste créé ; attendez une minute avant de renvoyer l’e-mail.");
    }
  };
}
