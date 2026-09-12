import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthService, SESSION_COOKIE } from "@/lib/auth/server";
import { getAccessManagement } from "@/lib/auth/access-management";
import { authErrorResponse } from "@/lib/auth/http";
import { isTrustedMutation, readLimitedBody } from "@/lib/auth/request-policy";
import { ManagementError } from "@/domain/ports/access-management";
import { getClientService } from "@/lib/clients/server";

export const runtime = "nodejs";
const uid = z.string().min(1).max(128).refine((value) => !value.includes("/"));
const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("invite"), email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()), name: z.string().trim().min(1).max(100) }).strict(),
  z.object({ action: z.literal("invitation"), uid }).strict(),
  z.object({ action: z.literal("deactivate"), uid }).strict(),
]);
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request.headers.get("origin"), request.headers.get("content-type"), process.env.APP_ORIGIN)) return json({ error: "Requête non autorisée." }, 403);
  try {
    const actor = await getAuthService().authorize(request.cookies.get(SESSION_COOKIE)?.value, ["admin"]);
    let raw;
    try { raw = await readLimitedBody(request); } catch { return json({ error: "Requête trop volumineuse." }, 413); }
    let parsed;
    try { parsed = input.safeParse(JSON.parse(raw)); } catch { return json({ error: "Requête invalide." }, 400); }
    if (!parsed.success) return json({ error: "Requête invalide." }, 400);
    const service = getAccessManagement();
    const data = parsed.data;
    if (data.action === "invite") {
      const clients = getClientService();
      const profile = await clients.create(actor, { email: data.email, name: data.name, phone: "", status: "active" });
      try { return json(await clients.invite(actor, profile.id), 201); }
      catch { return json({ error: "La fiche est créée. Ouvrez-la dans Clientes pour reprendre l’invitation.", clientId: profile.id }, 409); }
    }
    if (data.action === "invitation") return json(await service.invitation(actor, data.uid));
    await service.deactivate(actor, data.uid);
    return json({ success: true });
  } catch (error) {
    if (error instanceof ManagementError) return json({ error: error.message }, error.status);
    return authErrorResponse(error);
  }
}
