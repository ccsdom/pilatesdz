import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { clientSearchPrefixes } from "@/domain/models/client";

export const runtime = "nodejs";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Le nom est obligatoire.").max(100),
  phone: z.string().trim().min(8, "Numéro de téléphone invalide.").max(30),
  email: z.string().trim().email("Adresse e-mail invalide.").max(254).transform((val) => val.toLowerCase()),
  subject: z.string().trim().min(2, "Le sujet est obligatoire.").max(150),
  message: z.string().trim().min(5, "Le message doit contenir au moins 5 caractères.").max(2000),
});

const DEFAULT_CENTER = process.env.STUDIO_CENTER_ID || "pilates-center-alger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.errors[0]?.message || "Données du formulaire invalides.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const data = result.data;
    const db = getFirebaseAdmin().firestore;
    const now = Date.now();

    // 1. Store contact submission record in Firestore
    const contactRef = db.collection(`centers/${DEFAULT_CENTER}/contact_requests`).doc();
    await contactRef.set({
      id: contactRef.id,
      centerId: DEFAULT_CENTER,
      name: data.name,
      phone: data.phone,
      email: data.email,
      subject: data.subject,
      message: data.message,
      status: "new", // new | in_progress | resolved
      createdAt: now,
      updatedAt: now,
      source: "website_contact_form"
    });

    // 2. Sync / Upsert client lead in CRM clients collection
    const clientsRef = db.collection(`centers/${DEFAULT_CENTER}/clients`);
    const existingSnap = await clientsRef.where("email", "==", data.email).limit(1).get();

    if (existingSnap.empty) {
      // Create new client lead in CRM
      const newClientRef = clientsRef.doc();
      const clientProfile = {
        id: newClientRef.id,
        centerId: DEFAULT_CENTER,
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: "active",
        authUid: null,
        invitationUid: null,
        version: 1,
        createdAt: now,
        updatedAt: now,
        notes: `Prospect créé via formulaire de contact. Sujet: ${data.subject}`,
        searchPrefixes: clientSearchPrefixes({
          name: data.name,
          email: data.email,
          phone: data.phone,
          status: "active"
        })
      };
      await newClientRef.set(clientProfile);
    } else {
      // Update existing CRM record timestamp and search prefixes
      const clientDoc = existingSnap.docs[0];
      await clientDoc.ref.update({
        phone: data.phone || clientDoc.data().phone,
        updatedAt: now,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Votre message a été transmis avec succès au studio. Notre équipe vous recontactera très rapidement.",
      id: contactRef.id
    });

  } catch (error) {
    console.error("Erreur lors de l'enregistrement du message de contact:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'envoi de votre message. Veuillez réespérer ou nous contacter au 05 53 02 17 14." },
      { status: 500 }
    );
  }
}
