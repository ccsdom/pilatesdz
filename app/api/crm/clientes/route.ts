import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthService, SESSION_COOKIE } from "@/lib/auth/server";
import { getClientService } from "@/lib/clients/server";
import { authErrorResponse } from "@/lib/auth/http";
import { isTrustedMutation, readLimitedBody } from "@/lib/auth/request-policy";
import { ManagementError } from "@/domain/ports/access-management";
import { clientIdSchema, clientInputSchema } from "@/domain/models/client";
import { directoryFiltersSchema } from "@/domain/models/client-directory";

export const runtime = "nodejs";
const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), profile: clientInputSchema }).strict(),
  z.object({ action: z.literal("update"), id: clientIdSchema, version: z.number().int().positive(), profile: clientInputSchema }).strict(),
  z.object({ action: z.literal("invite"), id: clientIdSchema }).strict(),
]);
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
const failure = (error: unknown) => error instanceof ManagementError ? json({ error: error.message }, error.status) : authErrorResponse(error);

export async function GET(request: NextRequest) {
  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["admin"]);
    const params = request.nextUrl.searchParams;
    const id = params.get("id");
    if (id) return json(await getClientService().get(actor, id));
    const filters = directoryFiltersSchema.safeParse({ status: params.get("status") ?? "all", contact: params.get("contact") ?? "all" });
    if (!filters.success) return json({ error: "Filtres invalides." }, 400);
    return json(await getClientService().directory(actor, params.get("q") ?? "", params.get("after") ?? undefined, filters.data));
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request.headers.get("origin"), request.headers.get("content-type"), process.env.APP_ORIGIN)) return json({ error: "Requête non autorisée." }, 403);
  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["admin"]);
    let raw;
    try { raw = await readLimitedBody(request); } catch { return json({ error: "Requête trop volumineuse." }, 413); }
    let parsed;
    try { parsed = input.safeParse(JSON.parse(raw)); } catch { return json({ error: "Requête invalide." }, 400); }
    if (!parsed.success) return json({ error: "Vérifiez les informations de la fiche." }, 400);
    const service = getClientService();
    const data = parsed.data;
    if (data.action === "create") {
      const profile = await service.create(actor, data.profile);
      let invitationResult: { uid: string; invitationUrl: string | null; emailAccepted: boolean } | null = null;
      try {
        invitationResult = await service.invite(actor, profile.id);
      } catch { /* s'il existe déjà un compte ou en cas d'erreur réseau, conserver la création */ }
      return json({ profile, invitationUrl: invitationResult?.invitationUrl ?? null, emailAccepted: invitationResult?.emailAccepted ?? false }, 201);
    }
    if (data.action === "update") return json({ profile: await service.update(actor, data.id, data.version, data.profile) });
    return json(await service.invite(actor, data.id));
  } catch (error) { return failure(error); }
}
