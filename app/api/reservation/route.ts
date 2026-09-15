import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { clientSearchPrefixes } from "@/domain/models/client";
import { parseStudioDateTime } from "@/domain/models/planning";

export const runtime = "nodejs";

const reservationSchema = z.object({
  practiceId: z.string().min(1, "Veuillez choisir une discipline."),
  practiceName: z.string().min(1),
  gender: z.enum(["femme", "homme"]),
  date: z.string().min(1, "Veuillez choisir une date."),
  slot: z.string().min(1, "Veuillez choisir un créneau horaire."),
  clientName: z.string().trim().min(2, "Le nom est obligatoire.").max(100),
  clientPhone: z.string().trim().min(8, "Numéro de téléphone invalide.").max(30),
  clientEmail: z.string().trim().email("Adresse e-mail invalide.").or(z.literal("")).optional(),
  clientLevel: z.string().default("Débutant"),
  paymentMethod: z.enum(["studio", "credit"]).default("studio"),
});

const DEFAULT_CENTER = process.env.CENTER_ID || process.env.STUDIO_CENTER_ID || "alger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = reservationSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.errors[0]?.message || "Informations de réservation invalides.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const data = result.data;
    const db = getFirebaseAdmin().firestore;
    const now = Date.now();

    // 1. Compute start timestamp & session ID for CRM planning integration
    const startTimePart = data.slot.split("-")[0].trim(); // e.g. "17:00"
    const dateTimeStr = `${data.date}T${startTimePart}`; // e.g. "2026-09-17T17:00"
    let startsAt: number;
    try {
      startsAt = parseStudioDateTime(dateTimeStr);
    } catch {
      startsAt = now;
    }

    const sessionId = `pub_${data.date}_${startTimePart.replace(":", "")}_${data.gender}`;
    const sessionDocRef = db.doc(`centers/${DEFAULT_CENTER}/sessions/${sessionId}`);
    const resRef = db.collection(`centers/${DEFAULT_CENTER}/public_reservations`);

    // 2. Upsert / Sync Client profile in CRM database
    const clientsRef = db.collection(`centers/${DEFAULT_CENTER}/clients`);
    const formattedEmail = data.clientEmail ? data.clientEmail.toLowerCase() : `${data.clientPhone.replace(/\D/g, "")}@temp.pilates.dz`;

    const existingClientSnap = await clientsRef
      .where("phone", "==", data.clientPhone)
      .limit(1)
      .get();

    let clientId: string;

    if (existingClientSnap.empty) {
      // Create new client profile in CRM
      const newClientDoc = clientsRef.doc();
      clientId = newClientDoc.id;
      const clientProfile = {
        id: clientId,
        centerId: DEFAULT_CENTER,
        name: data.clientName,
        email: formattedEmail,
        phone: data.clientPhone,
        status: "active",
        authUid: null,
        invitationUid: null,
        version: 1,
        createdAt: now,
        updatedAt: now,
        notes: `Niveau: ${data.clientLevel}. Première réservation en ligne le ${data.date} à ${data.slot} (${data.practiceName})`,
        searchPrefixes: clientSearchPrefixes({
          name: data.clientName,
          email: formattedEmail,
          phone: data.clientPhone,
          status: "active"
        })
      };
      await newClientDoc.set(clientProfile);
    } else {
      // Use existing client doc ID
      const clientDoc = existingClientSnap.docs[0];
      clientId = clientDoc.id;
      const existingNotes = clientDoc.data().notes || "";
      await clientDoc.ref.update({
        updatedAt: now,
        notes: `${existingNotes}\nRéservation en ligne le ${data.date} à ${data.slot} (${data.practiceName})`.trim()
      });
    }

    // 3. Ensure Session exists in CRM Planning & Register Booking
    await db.runTransaction(async (tx) => {
      const sessionSnap = await tx.get(sessionDocRef);
      let bookedCount = 0;

      if (!sessionSnap.exists) {
        // Create session in planning
        tx.set(sessionDocRef, {
          id: sessionId,
          centerId: DEFAULT_CENTER,
          title: `${data.practiceName} (${data.gender === "femme" ? "Femmes" : "Hommes"})`,
          instructor: "Équipe Studio",
          startsAt,
          durationMinutes: 60,
          capacity: 4,
          status: "scheduled",
          bookedCount: 1,
          createdAt: now,
          createdBy: "online_booking"
        });
        bookedCount = 1;
      } else {
        const sessionData = sessionSnap.data();
        if (sessionData?.status === "cancelled") {
          throw new Error("Cette séance est annulée.");
        }
        bookedCount = sessionData?.bookedCount || 0;
        if (bookedCount >= (sessionData?.capacity || 4)) {
          throw new Error("Ce créneau est complet (4/4 places réservées).");
        }

        const bookingDocRef = sessionDocRef.collection("bookings").doc(clientId);
        const bookingSnap = await tx.get(bookingDocRef);

        if (!bookingSnap.exists || bookingSnap.data()?.status !== "confirmed") {
          bookedCount += 1;
          tx.update(sessionDocRef, { bookedCount, updatedAt: now });
        }
      }

      // Record booking under session for CRM attendance & participant view
      const bookingDocRef = sessionDocRef.collection("bookings").doc(clientId);
      tx.set(bookingDocRef, {
        sessionId,
        centerId: DEFAULT_CENTER,
        clientId,
        status: "confirmed",
        bookedAt: now,
        updatedAt: now,
        updatedBy: "online_booking",
        attendance: { status: "unmarked", version: 1 }
      });
    });

    // 4. Generate unique booking reference code
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingReference = `PIL-2026-${randomSuffix}`;

    // 5. Store Public Reservation Record in Firestore
    const newResDoc = resRef.doc();
    const reservationRecord = {
      id: newResDoc.id,
      centerId: DEFAULT_CENTER,
      reference: bookingReference,
      clientId,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      clientEmail: data.clientEmail || null,
      clientLevel: data.clientLevel,
      practiceId: data.practiceId,
      practiceName: data.practiceName,
      gender: data.gender,
      date: data.date,
      slot: data.slot,
      sessionId,
      paymentMethod: data.paymentMethod,
      status: "confirmed",
      createdAt: now,
      updatedAt: now,
      source: "website_online_booking"
    };

    await newResDoc.set(reservationRecord);

    return NextResponse.json({
      success: true,
      bookingReference,
      reservationId: newResDoc.id,
      message: "Votre réservation a été enregistrée et synchronisée avec le studio."
    });

  } catch (error: any) {
    console.error("Erreur lors de la création de la réservation:", error);
    return NextResponse.json(
      { error: error?.message || "Une erreur est survenue lors de l'enregistrement. Veuillez réessayer ou contacter le studio au 05 53 02 17 14." },
      { status: 500 }
    );
  }
}
