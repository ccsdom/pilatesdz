import "server-only";
import { NextResponse } from "next/server";
import { AccessError } from "@/domain/models/access";

export function authErrorResponse(error: unknown) {
  const status = error instanceof AccessError ? error.status : 503;
  return NextResponse.json({ error: status === 503 ? "Connexion temporairement indisponible. Réessayez plus tard." :
    status === 403 ? "Votre compte ne permet pas d’accéder à ce centre." : "Identifiants ou session non valides." },
  { status, headers: { "Cache-Control": "no-store" } });
}
