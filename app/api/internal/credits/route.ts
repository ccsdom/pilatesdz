import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { settlementRepository } from "@/repositories/firestore/credit-settlement";
export const runtime = "nodejs";
export const maxDuration = 60;
const verifier = new OAuth2Client();
export async function POST(request: NextRequest) {
  const audience = process.env.CREDIT_WORKER_AUDIENCE;
  const account = process.env.CREDIT_WORKER_SERVICE_ACCOUNT;
  if (!audience || !account) return NextResponse.json({ error: "Worker not configured" }, { status: 503 });
  const token = request.headers.get("authorization")?.match(/^Bearer (\S+)$/)?.[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const payload = (await verifier.verifyIdToken({ idToken: token, audience })).getPayload();
    if (!payload || payload.email !== account || payload.email_verified !== true) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  try {
    const result = await settlementRepository(getFirebaseAdmin().firestore).runAutomatic(process.env.CENTER_ID || "alger");
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Worker failed" }, { status: 503 }); }
}
