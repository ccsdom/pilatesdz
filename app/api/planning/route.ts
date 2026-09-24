import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthService, SESSION_COOKIE } from "@/lib/auth/server";
import { authErrorResponse } from "@/lib/auth/http";
import { isTrustedMutation, readLimitedBody } from "@/lib/auth/request-policy";
import { getPlanningService } from "@/lib/planning/server";
import { clientIdSchema } from "@/domain/models/client";
import { sessionInputSchema, studioDay } from "@/domain/models/planning";
import { ManagementError } from "@/domain/ports/access-management";

import { getClientService } from "@/lib/clients/server";

export const runtime = "nodejs";
const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), requestId: z.string().uuid(), session: sessionInputSchema }).strict(),
  z.object({ action: z.literal("book"), id: clientIdSchema }).strict(),
  z.object({ action: z.literal("book-client"), id: clientIdSchema, clientId: clientIdSchema }).strict(),
  z.object({ action: z.literal("cancel-booking"), id: clientIdSchema, clientId: clientIdSchema.optional() }).strict(),
  z.object({ action: z.literal("cancel-session"), id: clientIdSchema }).strict(),
]);
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
const failure = (error: unknown) => error instanceof ManagementError ? json({ error: error.message }, error.status) : authErrorResponse(error);
export async function GET(request: NextRequest) {
  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["admin", "manager", "client"]);
    const params = request.nextUrl.searchParams;
    const service = getPlanningService();
    return json(params.get("id") ? await service.get(actor, params.get("id")!) : await service.list(actor, params.get("day") ?? studioDay(), params.get("after") ?? undefined));
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request.headers.get("origin"), request.headers.get("content-type"), process.env.APP_ORIGIN)) return json({ error: "Requête non autorisée." }, 403);
  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["admin", "manager", "client"]);
    let raw;
    try { raw = await readLimitedBody(request); } catch { return json({ error: "Requête trop volumineuse." }, 413); }
    let parsed;
    try { parsed = input.safeParse(JSON.parse(raw)); } catch { return json({ error: "Requête invalide." }, 400); }
    if (!parsed.success) return json({ error: "Vérifiez les informations de la demande." }, 400);
    const data = parsed.data;
    const service = getPlanningService();
    if (data.action === "create") return json({ session: await service.create(actor, data.requestId, data.session) }, 201);
    if (data.action === "book") await service.book(actor, data.id);
    if (data.action === "book-client") {
      await service.bookForClient(actor, data.id, data.clientId);
      let invitationUrl: string | null = null;
      try {
        const clientService = getClientService();
        const details = await clientService.get(actor, data.clientId);
        if (details.access === "none" || details.access === "pending") {
          const inviteRes = await clientService.invite(actor, data.clientId);
          invitationUrl = inviteRes.invitationUrl;
        }
      } catch { /* au besoin conserver l'inscription même si l'invitation échoue */ }
      return json({ success: true, invitationUrl });
    }
    if (data.action === "cancel-booking") await service.cancelBooking(actor, data.id, data.clientId);
    if (data.action === "cancel-session") await service.cancelSession(actor, data.id);
    return json({ success: true });
  } catch (error) { return failure(error); }
}
