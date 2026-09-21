import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { clientInputSchema, clientSearchPrefixes } from "@/domain/models/client";
import { firstBookingDay } from "@/domain/models/public-booking-calendar";
import { studioSlots, slotAvailability } from "@/domain/models/studio-slots";
import { SINGLE_SESSION_OFFERS } from "@/domain/models/studio-offers";
import { publicDayQuery, readSlotOccupancy } from "@/repositories/firestore/public-availability";
import { isTrustedMutation, readLimitedBody } from "@/lib/auth/request-policy";
import { ManagementError } from "@/domain/ports/access-management";
import { getAccountProvisioner } from "@/lib/auth/access-management";

export const runtime = "nodejs";
const input = z.object({
  requestId: z.string().uuid(), practiceId: z.enum(["discovery", "single"]), practiceName: z.string().max(100),
  gender: z.enum(["femme", "homme"]), date: z.string().regex(/^20\d{2}-\d{2}-\d{2}$/), slot: z.string().max(20),
  clientName: clientInputSchema.shape.name, clientPhone: clientInputSchema.shape.phone,
  clientEmail: z.string().trim().email().max(254).transform(value => value.toLowerCase()).optional(),
  clientLevel: z.enum(["Débutant", "Intermédiaire", "Avancé"]), paymentMethod: z.literal("studio"),
}).strict();
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
const digest = (value: string) => createHash("sha256").update(value).digest("hex");

export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request.headers.get("origin"), request.headers.get("content-type"), process.env.APP_ORIGIN)) return json({ error: "Requête non autorisée." }, 403);
  let raw: string;
  try { raw = await readLimitedBody(request); } catch { return json({ error: "Requête trop volumineuse." }, 413); }
  let data;
  try { data = input.parse(JSON.parse(raw)); } catch { return json({ error: "Vérifiez vos coordonnées et le créneau. Pour utiliser un forfait, connectez-vous à votre espace." }, 400); }
  const now = Date.now();
  let slot;
  try { slot = studioSlots(data.date, data.gender).find(item => item.time === data.slot); } catch { /* invalid calendar date */ }
  if (!slot || data.date < firstBookingDay(now) || !data.clientPhone) return json({ error: "Choisissez un créneau ouvert à partir de demain et renseignez votre téléphone." }, 400);
  const centerId = process.env.CENTER_ID || process.env.STUDIO_CENTER_ID || "alger";
  if (!/^[a-z0-9-]+$/.test(centerId)) return json({ error: "Configuration indisponible." }, 503);
  const phone = data.clientPhone.replace(/\D/g, "");
  const normalizedPhone = phone.startsWith("213") ? `0${phone.slice(3)}` : phone;
  const offer = SINGLE_SESSION_OFFERS.find(item => item.id === data.practiceId)!;
  const fingerprint = digest(JSON.stringify({ ...data, practiceName: offer.label }));
  try {
    const db = getFirebaseAdmin().firestore;
    const root = db.doc(`centers/${centerId}`);
    const receipt = root.collection("public_reservations").doc(data.requestId);
    const identity = root.collection("public_contact_claims").doc(digest(normalizedPhone));
    const emailClaim = data.clientEmail ? root.collection("public_contact_claims").doc(digest(data.clientEmail)) : null;
    const clientRef = root.collection("clients").doc();
    const sessionRef = root.collection("sessions").doc(slot.id);
    const selected = slot;
    const result = await db.runTransaction(async tx => {
      const previous = (await tx.get(receipt)).data();
      if (previous) {
        if (previous.fingerprint !== fingerprint) throw new ManagementError(409, "Cette demande a déjà été utilisée. Actualisez la page.");
        return { bookingReference: previous.reference as string, reservationId: receipt.id, email: null, name: null, uid: null };
      }
      const claim = await tx.get(identity);
      const emailIdentity = emailClaim ? await tx.get(emailClaim) : null;
      const clients = root.collection("clients");
      const variants = [...new Set([data.clientPhone, phone, normalizedPhone, normalizedPhone.startsWith("0") ? `+213${normalizedPhone.slice(1)}` : normalizedPhone])];
      const samePhone = await tx.get(clients.where("phone", "in", variants).limit(1));
      const indexedPhone = await tx.get(clients.where("searchPrefixes", "array-contains", normalizedPhone).limit(1));
      const internationalPhone = await tx.get(clients.where("searchPrefixes", "array-contains", `213${normalizedPhone.slice(1)}`).limit(1));
      const sameEmail = data.clientEmail ? await tx.get(clients.where("email", "==", data.clientEmail).limit(1)) : null;
      if (claim.exists || emailIdentity?.exists || !samePhone.empty || !indexedPhone.empty || !internationalPhone.empty || (sameEmail && !sameEmail.empty)) throw new ManagementError(409, "Pour poursuivre, connectez-vous à votre espace ou contactez le studio afin de vérifier votre accès.");
      const snapshot = await tx.get(publicDayQuery(db, centerId, data.date));
      if (snapshot.size > 100) throw new ManagementError(409, "Le studio doit vérifier ce planning.");
      const occupancy = snapshot.docs.map(doc => readSlotOccupancy(doc.id, centerId, doc.data()));
      const available = slotAvailability(selected, occupancy, Date.now());
      if (available.available < 1) throw new ManagementError(409, "Ce créneau n’est plus disponible. Choisissez un autre horaire.");
      const profile = { name: data.clientName, email: data.clientEmail ?? `${normalizedPhone}@temp.pilates.dz`, phone: normalizedPhone, status: "active" as const };
      const invitationUid = `pc_${createHash("sha256").update(`${centerId}/${clientRef.id}`).digest("hex")}`;
      tx.create(clientRef, { ...profile, id: clientRef.id, centerId, authUid: invitationUid, invitationUid: null, version: 1, createdAt: now, updatedAt: now, searchPrefixes: clientSearchPrefixes(profile) });
      tx.create(root.collection("members").doc(invitationUid), { uid: invitationUid, clientId: clientRef.id, centerId, role: "client", active: true, email: profile.email, name: profile.name, createdAt: now, createdBy: "online_booking" });
      tx.create(identity, { clientId: clientRef.id, createdAt: now });
      if (emailClaim) tx.create(emailClaim, { clientId: clientRef.id, createdAt: now });
      if (occupancy.some(item => item.id === selected.id)) tx.update(sessionRef, { bookedCount: available.reserved + 1, updatedAt: now });
      else tx.create(sessionRef, { id: selected.id, centerId, title: `Créneau ${data.gender === "femme" ? "Femmes" : "Hommes"}`, instructor: "Équipe Studio", startsAt: selected.startsAt, durationMinutes: 60, capacity: 4, status: "scheduled", bookedCount: 1, createdAt: now, createdBy: "online_booking" });
      tx.create(sessionRef.collection("bookings").doc(clientRef.id), { sessionId: selected.id, centerId, clientId: clientRef.id, status: "confirmed", bookedAt: now, updatedAt: now, updatedBy: "online_booking", attendance: { status: "unmarked", version: 1 } });
      const reference = `PIL-${data.date.slice(0, 4)}-${data.requestId.toUpperCase()}`;
      tx.create(receipt, { id: receipt.id, fingerprint, reference, centerId, clientId: clientRef.id, clientName: data.clientName, clientPhone: normalizedPhone, clientEmail: data.clientEmail ?? null, clientLevel: data.clientLevel, practiceId: offer.id, practiceName: offer.label, priceDzd: offer.priceDzd, gender: data.gender, date: data.date, slot: selected.time, sessionId: selected.id, paymentMethod: "studio", status: "confirmed", createdAt: now, updatedAt: now, source: "website_online_booking" });
      return { bookingReference: reference, reservationId: receipt.id, email: profile.email, name: profile.name, uid: invitationUid };
    });

    let invitationUrl: string | null = null;
    if (result.email && result.name && result.uid) {
      try {
        const provisioner = getAccountProvisioner();
        await provisioner.create(result.email, result.name, result.uid);
        invitationUrl = await provisioner.invitation(result.email);
      } catch { /* if auth account creation encounters existing record, keep reservation confirmed */ }
    }

    return json({ success: true, bookingReference: result.bookingReference, reservationId: result.reservationId, invitationUrl }, 201);
  } catch (error) {
    if (error instanceof ManagementError) return json({ error: error.message }, error.status);
    return json({ error: "Réservation non confirmée. Réessayez avec les mêmes informations ou contactez le studio." }, 503);
  }
}
