import { describe, expect, it } from "vitest";
import { defaultStudioOpening, openingRanges, studioOpeningSchema } from "../../src/domain/models/studio-opening";
import { studioSlots } from "../../src/domain/models/studio-slots";
import { openingImpact, type OpeningImpactSession } from "../../src/domain/models/opening-impact";

describe("horaires du centre", () => {
  it("préserve les horaires et identifiants des sept jours actuels", () => {
    for (let index = 0; index < 7; index++) {
      const day = `2026-10-${String(11 + index).padStart(2, "0")}`;
      const change = [1, 3, 6].includes(index) ? 14 : 18;
      const women = studioSlots(day, "femme"), men = studioSlots(day, "homme");
      expect(women).toHaveLength(index === 5 ? 0 : change - 10);
      expect(men).toHaveLength(index === 5 ? 0 : 20 - change);
      if (index !== 5) {
        expect(women[0].id).toBe(`pub_${day}_1000_femme`);
        expect(men.at(-1)?.time).toBe("19:00 - 20:00");
        expect([...women, ...men].every(slot => slot.totalCapacity === 4 && slot.endsAt - slot.startsAt === 3600000)).toBe(true);
      }
    }
  });
  it("une fermeture remplace la journée et une exception peut ouvrir un vendredi", () => {
    const opening = defaultStudioOpening();
    opening.exceptions = [
      { day: "2026-10-12", reason: "Fermeture", ranges: [] },
      { day: "2026-10-16", reason: "Ouverture exceptionnelle", ranges: [{ audience: "femme", startMinute: 570, endMinute: 690 }] },
    ];
    expect(studioSlots("2026-10-12", "femme", opening)).toEqual([]);
    expect(studioSlots("2026-10-12", "homme", opening)).toEqual([]);
    expect(studioSlots("2026-10-16", "femme", opening).map(slot => slot.time)).toEqual(["09:30 - 10:30", "10:30 - 11:30"]);
    expect(studioSlots("2026-10-16", "homme", opening)).toEqual([]);
    expect(studioSlots("2026-10-23", "femme", opening)).toEqual([]);
  });
  it("respecte les pauses et minuit à Alger", () => {
    const opening = defaultStudioOpening();
    opening.week[1] = [
      { audience: "femme", startMinute: 1380, endMinute: 1440 },
      { audience: "femme", startMinute: 600, endMinute: 660 },
    ];
    const slots = studioSlots("2026-10-12", "femme", opening);
    expect(slots.map(slot => slot.time)).toEqual(["10:00 - 11:00", "23:00 - 24:00"]);
    expect(new Date(slots[1].startsAt).toISOString()).toBe("2026-10-12T22:00:00.000Z");
    expect(new Date(slots[1].endsAt).toISOString()).toBe("2026-10-12T23:00:00.000Z");
  });
  it.each([
    [{ audience: "femme", startMinute: 600, endMinute: 720 }, { audience: "homme", startMinute: 660, endMinute: 780 }],
    [{ audience: "femme", startMinute: 600, endMinute: 630 }],
    [{ audience: "femme", startMinute: 720, endMinute: 600 }],
    [{ audience: "femme", startMinute: -60, endMinute: 60 }],
  ])("refuse chevauchement, séance incomplète ou plage invalide : %j", (...ranges) => {
    const opening = { ...defaultStudioOpening(), week: [ranges, ...defaultStudioOpening().week.slice(1)] };
    expect(studioOpeningSchema.safeParse(opening).success).toBe(false);
  });
  it("refuse dates inexistantes, doublons, autre capacité ou autre fuseau", () => {
    const opening = defaultStudioOpening();
    expect(studioOpeningSchema.safeParse({ ...opening, capacity: 5 }).success).toBe(false);
    expect(studioOpeningSchema.safeParse({ ...opening, timeZone: "Europe/Paris" }).success).toBe(false);
    expect(studioOpeningSchema.safeParse({ ...opening, exceptions: [{ day: "2026-02-30", reason: "Fermé", ranges: [] }] }).success).toBe(false);
    const exception = { day: "2026-10-12", reason: "Fermé", ranges: [] };
    expect(studioOpeningSchema.safeParse({ ...opening, exceptions: [exception, exception] }).success).toBe(false);
    expect(() => openingRanges("2026-02-30", opening)).toThrow();
  });
  it("ne partage pas de références mutables entre configurations", () => {
    const opening = defaultStudioOpening();
    opening.week[0][0].startMinute = 0;
    expect(defaultStudioOpening().week[0][0].startMinute).toBe(600);
  });
});

describe("aperçu des conséquences", () => {
  const slot = studioSlots("2026-10-12", "femme")[0];
  const session: OpeningImpactSession = { id: slot.id, startsAt: slot.startsAt, durationMinutes: 60, capacity: 4, bookedCount: 1, status: "scheduled", createdBy: "online_booking" };
  const closed = defaultStudioOpening();
  closed.exceptions = [{ day: "2026-10-12", reason: "Fermeture", ranges: [] }];
  it("distingue réservation à traiter, créneau vide et séance manuelle sans rien modifier", () => {
    const empty = { ...session, id: "pub_2026-10-12_1100_femme", startsAt: slot.startsAt + 3600000, bookedCount: 0, createdBy: "automatic_slots" };
    const manual = { ...session, id: "manual", createdBy: "manager" };
    const before = JSON.stringify([session, empty, manual]);
    expect(openingImpact(closed, [session, empty, manual], 0)).toEqual({ conflictingBookings: [session.id], obsoleteEmptySlots: [empty.id], preservedManualSessions: [manual.id] });
    expect(JSON.stringify([session, empty, manual])).toBe(before);
  });
  it("un changement de public ne réaffecte pas les réservations", () => {
    const opening = defaultStudioOpening();
    opening.week[1] = [{ audience: "homme", startMinute: 600, endMinute: 1200 }];
    expect(openingImpact(opening, [session], 0).conflictingBookings).toEqual([session.id]);
  });
  it("préserve les annulations explicites, les séances commencées et les horaires inchangés", () => {
    expect(openingImpact(closed, [{ ...session, status: "cancelled" }], 0).obsoleteEmptySlots).toEqual([]);
    expect(openingImpact(closed, [session], slot.startsAt).conflictingBookings).toEqual([]);
    expect(openingImpact(defaultStudioOpening(), [session], 0).conflictingBookings).toEqual([]);
  });
  it("échoue explicitement sur configuration ou compteurs corrompus", () => {
    expect(() => openingImpact({ ...closed, capacity: 8 } as unknown as typeof closed, [session], 0)).toThrow();
    expect(() => openingImpact(closed, [{ ...session, bookedCount: 5 }], 0)).toThrow();
    expect(() => openingImpact(closed, [session, session], 0)).toThrow();
  });
});
