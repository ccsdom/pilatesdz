import { NextResponse } from "next/server";
import { readOpeningPolicy } from "@/repositories/firestore/opening-settings";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const policy = await readOpeningPolicy(getFirebaseAdmin().firestore, process.env.CENTER_ID || process.env.STUDIO_CENTER_ID || "alger");
    // No operator identity or internal audit data on this public endpoint.
    return NextResponse.json({ revisions: policy.revisions.map(({ effectiveFrom, opening }) => ({ effectiveFrom, opening })) }, { headers });
  } catch { return NextResponse.json({ error: "Horaires temporairement indisponibles." }, { status: 503, headers }); }
}
