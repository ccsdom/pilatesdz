import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthService, SESSION_COOKIE } from "@/lib/auth/server";
import { authErrorResponse } from "@/lib/auth/http";
import { isTrustedMutation, readLimitedBody } from "@/lib/auth/request-policy";
import { getMeasurementService } from "@/lib/clients/measurements";
import { ManagementError } from "@/domain/ports/access-management";
import { clientIdSchema } from "@/domain/models/client";
import { measurementInputSchema } from "@/domain/models/measurements";
export const runtime = "nodejs";
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
const failure = (error: unknown) => error instanceof ManagementError ? json({ error: error.message }, error.status) : authErrorResponse(error);
export async function GET(request: NextRequest) {
  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["admin"]);
    return json(await getMeasurementService().list(actor, request.nextUrl.searchParams.get("clientId") ?? "", request.nextUrl.searchParams.get("after") ?? undefined));
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request.headers.get("origin"), request.headers.get("content-type"), process.env.APP_ORIGIN)) return json({ error: "Requête non autorisée." }, 403);
  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["admin"]);
    let raw;
    try { raw = await readLimitedBody(request); } catch { return json({ error: "Requête trop volumineuse." }, 413); }
    let payload: unknown;
    try { payload = JSON.parse(raw); } catch { return json({ error: "Requête invalide." }, 400); }
    const parsed = z.object({ clientId: clientIdSchema, version: z.number().int().min(0), measurement: measurementInputSchema }).strict().safeParse(payload);
    if (!parsed.success) return json({ error: "Renseignez une date et au moins une mesure valide." }, 400);
    return json({ measurement: await getMeasurementService().save(actor, parsed.data.clientId, parsed.data.measurement, parsed.data.version) });
  } catch (error) { return failure(error); }
}
