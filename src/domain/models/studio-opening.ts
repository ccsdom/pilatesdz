import { z } from "zod";
import { bookingCalendarDate } from "./public-booking-calendar";
import { STUDIO_TIME_ZONE } from "./planning";
import { COURSE_DURATION_MINUTES, COURSE_MAX_CAPACITY } from "./studio-offers";

const calendarDay = z.string().refine(value => {
  try { bookingCalendarDate(value); return true; } catch { return false; }
}, "Date invalide.");
const openingRangeSchema = z.object({
  audience: z.enum(["femme", "homme"]),
  startMinute: z.number().int().min(0).max(1380),
  endMinute: z.number().int().min(60).max(1440),
}).strict().superRefine((range, ctx) => {
  if (range.endMinute <= range.startMinute || (range.endMinute - range.startMinute) % COURSE_DURATION_MINUTES !== 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Chaque plage doit contenir des créneaux complets d’une heure." });
  }
});
const rangesSchema = z.array(openingRangeSchema).max(24).superRefine((ranges, ctx) => {
  const sorted = [...ranges].sort((a, b) => a.startMinute - b.startMinute);
  for (let index = 1; index < sorted.length; index++) {
    if (sorted[index].startMinute < sorted[index - 1].endMinute) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Les plages ne peuvent pas se chevaucher, même pour des publics différents." });
    }
  }
});

/** Sunday is index 0, matching the calendar date's UTC weekday. */
export const studioOpeningSchema = z.object({
  timeZone: z.literal(STUDIO_TIME_ZONE),
  durationMinutes: z.literal(COURSE_DURATION_MINUTES),
  capacity: z.literal(COURSE_MAX_CAPACITY),
  week: z.array(rangesSchema).length(7),
  exceptions: z.array(z.object({
    day: calendarDay,
    ranges: rangesSchema,
    reason: z.string().trim().min(1).max(160),
  }).strict()).max(366),
}).strict().superRefine((opening, ctx) => {
  const days = new Set<string>();
  for (const exception of opening.exceptions) {
    if (days.has(exception.day)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Une seule exception est autorisée par date." });
    days.add(exception.day);
  }
});
export type StudioOpening = z.infer<typeof studioOpeningSchema>;
export type OpeningRange = StudioOpening["week"][number][number];

/** Fresh objects prevent a form editing defaults from changing another consumer. */
export function defaultStudioOpening(): StudioOpening {
  return {
    timeZone: STUDIO_TIME_ZONE, durationMinutes: COURSE_DURATION_MINUTES, capacity: COURSE_MAX_CAPACITY,
    week: Array.from({ length: 7 }, (_, weekday) => {
      if (weekday === 5) return [];
      const change = [6, 1, 3].includes(weekday) ? 14 * 60 : 18 * 60;
      return [
        { audience: "femme", startMinute: 600, endMinute: change },
        { audience: "homme", startMinute: change, endMinute: 1200 },
      ];
    }),
    exceptions: [],
  };
}

/** An exception replaces the whole day; an empty list means closed. */
export function openingRanges(day: string, opening: StudioOpening): OpeningRange[] {
  const weekday = bookingCalendarDate(day).getUTCDay();
  const validated = studioOpeningSchema.parse(opening);
  return [...(validated.exceptions.find(item => item.day === day)?.ranges ?? validated.week[weekday])]
    .sort((a, b) => a.startMinute - b.startMinute);
}
