import "server-only";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { AccessError, type Access } from "@/domain/models/access";
import { clientIdSchema } from "@/domain/models/client";
import { measurementDaySchema, measurementInputSchema, type PersonalMeasurementPage } from "@/domain/models/measurements";
import { ManagementError } from "@/domain/ports/access-management";

export async function personalMeasurements(actor: Access, after?: string): Promise<PersonalMeasurementPage> {
  if (actor.role !== "client" || !/^[a-z0-9-]+$/.test(actor.centerId) || !clientIdSchema.safeParse(actor.uid).success) throw new AccessError(403);
  if (after && !measurementDaySchema.safeParse(after).success) throw new ManagementError(400, "Page invalide.");
  const db = getFirebaseAdmin().firestore;
  return db.runTransaction(async tx => {
    const root = db.doc(`centers/${actor.centerId}`);
    const member = (await tx.get(root.collection("members").doc(actor.uid))).data();
    if (!member || member.uid !== actor.uid || member.centerId !== actor.centerId || member.role !== "client" || member.active !== true || !clientIdSchema.safeParse(member.clientId).success) throw new AccessError(403);
    const ref = root.collection("clients").doc(member.clientId);
    const client = (await tx.get(ref)).data();
    if (!client || client.id !== member.clientId || client.centerId !== actor.centerId || client.authUid !== actor.uid || client.status !== "active") throw new AccessError(403);
    let query = ref.collection("measurements").orderBy("day", "desc").limit(26);
    if (after) query = query.startAfter(after);
    const snapshot = await tx.get(query);
    const measurements = snapshot.docs.slice(0, 25).map(doc => {
      const data = doc.data();
      if (data.centerId !== actor.centerId || data.clientId !== client.id || data.day !== doc.id) throw new Error("Invalid measurement owner");
      return measurementInputSchema.parse({ day: data.day, values: data.values });
    });
    return { measurements, next: snapshot.size > 25 ? measurements.at(-1)!.day : null };
  });
}
