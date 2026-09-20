import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { bookingCalendarDate, firstBookingDay } from "@/domain/models/public-booking-calendar";
import { publicAvailability } from "@/repositories/firestore/public-availability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
export async function GET(request: NextRequest) {
  const day = request.nextUrl.searchParams.get("day") ?? "";
  const audience = request.nextUrl.searchParams.get("audience");
  try { bookingCalendarDate(day); } catch { return json({ error: "Date invalide." }, 400); }
  if (day < firstBookingDay(Date.now()) || day > "2099-12-31" || !["femme", "homme"].includes(audience ?? "")) return json({ error: "Choisissez une date à partir de demain et un public." }, 400);
  try {
    const slots = await publicAvailability(getFirebaseAdmin().firestore, process.env.CENTER_ID || process.env.STUDIO_CENTER_ID || "alger", day, audience as "femme" | "homme");
    return json({ slots });
  } catch { return json({ error: "Les disponibilités sont temporairement indisponibles. Réessayez." }, 503); }
}
