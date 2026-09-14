import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { clientSearchPrefixes } from "@/domain/models/client";

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

const DEFAULT_CENTER = process.env.STUDIO_CENTER_ID || "pilates-center-alger";

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

    // 1. Check current capacity for this date + slot in Firestore
    const resRef = db.collection(`centers/${DEFAULT_CENTER}/public_reservations`);
    const existingBookings = await resRef
      .where("date", "==", data.date)
      .where("slot", "==", data.slot)
      .where("status", "==", "confirmed")
      .get();

    if (existingBookings.size >= 4) {
      return NextResponse.json(
        { error: "Ce créneau est malheureusement complet (4/4 places réservées). Veuillez choisir un autre horaire." },
        { status: 400 }
      );
    }

    // 2. Generate unique booking reference code
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingReference = `PIL-2026-${randomSuffix}`;

    // 3. Upsert / Sync Client in CRM database
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
        notes: `Niveau: ${data.clientLevel}. Première réservation le ${data.date} à ${data.slot} (${data.practiceName})`,
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
      await clientDoc.ref.update({
        updatedAt: now,
        notes: `${clientDoc.data().notes || ""}\nNouvelle réservation le ${data.date} à ${data.slot} (${data.practiceName})`
      });
    }

    // 4. Store Reservation Record in Firestore
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
      paymentMethod: data.paymentMethod,
      status: "confirmed", // confirmed | cancelled | completed
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

  } catch (error) {
    console.error("Erreur lors de la création de la réservation:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'enregistrement. Veuillez réessayer ou contacter le studio au 05 53 02 17 14." },
      { status: 500 }
    );
  }
}
