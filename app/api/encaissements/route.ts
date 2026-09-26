import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthService, SESSION_COOKIE } from "@/lib/auth/server";
import { authErrorResponse } from "@/lib/auth/http";
import { isTrustedMutation, readLimitedBody } from "@/lib/auth/request-policy";
import { getPaymentService } from "@/lib/packages/payments";
import { clientIdSchema } from "@/domain/models/client";
import { paymentInputSchema } from "@/domain/models/payment";
import { ManagementError } from "@/domain/ports/access-management";
import { extractIdempotencyKey } from "@/lib/auth/idempotency";
import { getClientIp, rateLimiter } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
const schema = z.object({ clientId: clientIdSchema, subscriptionId: z.string().uuid(), requestId: z.string().uuid(), payment: paymentInputSchema }).strict();
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
const failure = (error: unknown) => error instanceof ManagementError ? json({ error: error.message }, error.status) : authErrorResponse(error);

export async function GET(request: NextRequest) {
  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["admin", "manager"]);
    return json(await getPaymentService().list(actor, request.nextUrl.searchParams.get("clientId") ?? "", request.nextUrl.searchParams.get("subscriptionId") ?? "", request.nextUrl.searchParams.get("after") ?? undefined));
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request.headers.get("origin"), request.headers.get("content-type"), process.env.APP_ORIGIN)) return json({ error: "Requête non autorisée." }, 403);

  const clientIp = getClientIp(request.headers);
  const limit = rateLimiter.check(`encaissement_${clientIp}`, { windowMs: 60000, max: 60 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Trop de requêtes. Veuillez patienter un instant." },
      { status: 429, headers: { "Retry-After": Math.ceil(limit.resetMs / 1000).toString(), "Cache-Control": "no-store" } }
    );
  }

  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["admin", "manager"]);
    let raw; try { raw = await readLimitedBody(request); } catch { return json({ error: "Requête trop volumineuse." }, 413); }
    let rawObj: Record<string, unknown> = {};
    try {
      rawObj = JSON.parse(raw);
      const headerKey = extractIdempotencyKey(request.headers, rawObj);
      if (headerKey) rawObj.requestId = headerKey;
    } catch { return json({ error: "Requête invalide." }, 400); }
    const parsed = schema.safeParse(rawObj);
    if (!parsed.success) return json({ error: "Vérifiez le montant et la date de réception des espèces." }, 400);
    const data = parsed.data;
    return json({ payment: await getPaymentService().record(actor, data.clientId, data.subscriptionId, data.requestId, data.payment) }, 201);
  } catch (error) { return failure(error); }
}

