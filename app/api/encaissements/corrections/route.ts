import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthService, SESSION_COOKIE } from "@/lib/auth/server";
import { authErrorResponse } from "@/lib/auth/http";
import { isTrustedMutation, readLimitedBody } from "@/lib/auth/request-policy";
import { getPaymentService } from "@/lib/packages/payments";
import { clientIdSchema } from "@/domain/models/client";
import { paymentCorrectionSchema } from "@/domain/models/payment";
import { ManagementError } from "@/domain/ports/access-management";
export const runtime = "nodejs";
const schema = z.object({ clientId: clientIdSchema, subscriptionId: z.string().uuid(), requestId: z.string().uuid(), correction: paymentCorrectionSchema }).strict();
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request.headers.get("origin"), request.headers.get("content-type"), process.env.APP_ORIGIN)) return json({ error: "Requête non autorisée." }, 403);
  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["admin", "manager"]);
    let raw; try { raw = await readLimitedBody(request); } catch { return json({ error: "Requête trop volumineuse." }, 413); }
    let parsed; try { parsed = schema.safeParse(JSON.parse(raw)); } catch { return json({ error: "Requête invalide." }, 400); }
    if (!parsed.success) return json({ error: "Indiquez l’encaissement et un motif de 5 à 300 caractères." }, 400);
    const data = parsed.data;
    return json({ correction: await getPaymentService().correct(actor, data.clientId, data.subscriptionId, data.requestId, data.correction) }, 201);
  } catch (error) { return error instanceof ManagementError ? json({ error: error.message }, error.status) : authErrorResponse(error); }
}
