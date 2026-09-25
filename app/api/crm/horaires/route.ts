import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthService, SESSION_COOKIE } from "@/lib/auth/server";
import { authErrorResponse } from "@/lib/auth/http";
import { isTrustedMutation, readLimitedBody } from "@/lib/auth/request-policy";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { getOpeningSettings, reviewOpeningSettings } from "@/repositories/firestore/opening-settings";
import { studioOpeningSchema } from "@/domain/models/studio-opening";
import { openingDateSchema } from "@/domain/models/opening-policy";
import { ManagementError } from "@/domain/ports/access-management";
export const runtime = "nodejs";
const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { "Cache-Control": "no-store" } });
const failure = (error: unknown) => error instanceof ManagementError ? json({ error: error.message }, error.status) : authErrorResponse(error);
const input = z.object({ action: z.enum(["preview", "save"]), expectedVersion: z.number().int().nonnegative(), effectiveFrom: openingDateSchema, opening: studioOpeningSchema }).strict();
export async function GET(request: NextRequest) {
  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["admin", "manager"]);
    return json(await getOpeningSettings(getFirebaseAdmin().firestore, actor));
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request.headers.get("origin"), request.headers.get("content-type"), process.env.APP_ORIGIN)) return json({ error: "Requête non autorisée." }, 403);
  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["admin", "manager"]);
    let raw;
    try { raw = JSON.parse(await readLimitedBody(request)); } catch { return json({ error: "Requête invalide ou trop volumineuse." }, 400); }
    const parsed = input.safeParse(raw);
    if (!parsed.success) return json({ error: "Vérifiez les dates et les horaires : des heures complètes, sans chevauchement ni exception en double." }, 400);
    const { action, opening, effectiveFrom, expectedVersion } = parsed.data;
    return json(await reviewOpeningSettings(getFirebaseAdmin().firestore, actor, opening, effectiveFrom, expectedVersion, action === "save"));
  } catch (error) { return failure(error); }
}
