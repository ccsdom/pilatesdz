import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AccessError, type CenterRole } from "@/domain/models/access";
import { getAuthService, SESSION_COOKIE } from "./server";

export async function getPageAccess(roles: readonly CenterRole[]) {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) redirect("/connexion");
  try { return { access: await getAuthService().authorize(cookie, roles) }; }
  catch (error) {
    if (error instanceof AccessError && error.status === 401) redirect("/connexion");
    return { error: error instanceof AccessError ? "Accès non autorisé à cet espace." : "Service temporairement indisponible. Réessayez plus tard." };
  }
}
