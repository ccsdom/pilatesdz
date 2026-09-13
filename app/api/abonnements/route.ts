import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthService, SESSION_COOKIE } from "@/lib/auth/server";
import { authErrorResponse } from "@/lib/auth/http";
import { isTrustedMutation, readLimitedBody } from "@/lib/auth/request-policy";
import { getSubscriptionService } from "@/lib/packages/subscriptions";
import { clientIdSchema } from "@/domain/models/client";
import { subscriptionInputSchema } from "@/domain/models/subscription";
import { ManagementError } from "@/domain/ports/access-management";
export const runtime = "nodejs";
const input = z.object({ requestId: z.string().uuid(), clientId: clientIdSchema, subscription: subscriptionInputSchema }).strict();
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
export async function GET(request: NextRequest) {
  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["admin", "client"]);
    return json(await getSubscriptionService().list(actor, request.nextUrl.searchParams.get("clientId") ?? undefined, request.nextUrl.searchParams.get("after") ?? undefined));
  } catch (error) { return error instanceof ManagementError ? json({ error: error.message }, error.status) : authErrorResponse(error); }
}
export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request.headers.get("origin"), request.headers.get("content-type"), process.env.APP_ORIGIN)) return json({ error: "Requête non autorisée." }, 403);
  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["admin"]);
    let raw;
    try { raw = await readLimitedBody(request); } catch { return json({ error: "Requête trop volumineuse." }, 413); }
    let parsed;
    try { parsed = input.safeParse(JSON.parse(raw)); } catch { return json({ error: "Requête invalide." }, 400); }
    if (!parsed.success) return json({ error: "Vérifiez la formule et la date d’achat." }, 400);
    const data = parsed.data;
    return json({ subscription: await getSubscriptionService().assign(actor, data.clientId, data.requestId, data.subscription) }, 201);
  } catch (error) { return error instanceof ManagementError ? json({ error: error.message }, error.status) : authErrorResponse(error); }
}
