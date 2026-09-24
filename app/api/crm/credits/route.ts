import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthService, SESSION_COOKIE } from "@/lib/auth/server";
import { authErrorResponse } from "@/lib/auth/http";
import { isTrustedMutation, readLimitedBody } from "@/lib/auth/request-policy";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { settlementRepository } from "@/repositories/firestore/credit-settlement";
import { settlementInput } from "@/domain/models/credit-settlement";
import { ManagementError } from "@/domain/ports/access-management";
export const runtime = "nodejs";
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
const failure = (error: unknown) => error instanceof ManagementError ? json({ error: error.message }, error.status) : authErrorResponse(error);
export async function GET(request: NextRequest) {
  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["admin", "manager"]);
    return json(await settlementRepository(getFirebaseAdmin().firestore).settings(actor));
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request.headers.get("origin"), request.headers.get("content-type"), process.env.APP_ORIGIN)) return json({ error: "Requête non autorisée." }, 403);
  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["admin", "manager"]);
    let raw;
    try { raw = await readLimitedBody(request); } catch { return json({ error: "Requête trop volumineuse." }, 413); }
    const schema = z.discriminatedUnion("action", [settlementInput.extend({ action: z.literal("decide") }), z.object({ action: z.literal("mode"), mode: z.enum(["manual", "automatic"]), version: z.number().int().min(0) }).strict()]);
    let parsed;
    try { parsed = schema.safeParse(JSON.parse(raw)); } catch { return json({ error: "Requête invalide." }, 400); }
    if (!parsed.success) return json({ error: "Vérifiez la décision et indiquez un motif de cinq caractères minimum." }, 400);
    const repository = settlementRepository(getFirebaseAdmin().firestore);
    if (parsed.data.action === "mode") return json(await repository.setMode(actor, parsed.data.mode, parsed.data.version));
    const { id, clientId, version, state, requestId, reason } = parsed.data;
    const input = { id, clientId, version, state, requestId, reason };
    return json(await repository.decide(actor, input));
  } catch (error) { return failure(error); }
}
