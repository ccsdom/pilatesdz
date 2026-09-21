import { z } from "zod";
import { studioDay } from "./planning";

export const measurementFields = [
  { key: "weight", label: "Poids", unit: "kg", max: 500 },
  { key: "height", label: "Stature", unit: "cm", max: 250 },
  { key: "chest", label: "Poitrine", unit: "cm", max: 300 },
  { key: "waist", label: "Tour de taille", unit: "cm", max: 300 },
  { key: "hips", label: "Hanches", unit: "cm", max: 300 },
  { key: "thigh", label: "Cuisse", unit: "cm", max: 200 },
  { key: "arm", label: "Bras", unit: "cm", max: 150 },
] as const;
export type MeasurementKey = typeof measurementFields[number]["key"];
export const measurementDaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(day => {
  const date = new Date(`${day}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === day && day >= "1900-01-01";
}, "Date invalide.");
const value = (max: number) => z.number().finite().positive().max(max).multipleOf(0.1).optional();
export const measurementValuesSchema = z.object({ weight: value(500), height: value(250), chest: value(300), waist: value(300), hips: value(300), thigh: value(200), arm: value(150) }).strict().refine(values => Object.values(values).some(v => v !== undefined), "Renseignez au moins une mensuration.");
export const measurementInputSchema = z.object({ day: measurementDaySchema, values: measurementValuesSchema }).strict();
export type MeasurementInput = z.infer<typeof measurementInputSchema>;
export type Measurement = MeasurementInput & { centerId: string; clientId: string; version: number; createdAt: number; updatedAt: number; createdBy: string; updatedBy: string };
export type MeasurementPage = { measurements: Measurement[]; next: string | null };
export type PersonalMeasurementPage = { measurements: MeasurementInput[]; next: string | null };
export function isMeasurementDayAllowed(day: string, now = Date.now()) { return measurementDaySchema.safeParse(day).success && day <= studioDay(now); }
export function measurementEvolution(records: Measurement[], key: MeasurementKey) {
  const points = records.filter(r => r.values[key] !== undefined).sort((a, b) => a.day.localeCompare(b.day));
  const first = points[0], last = points.at(-1);
  return { points, latest: last?.values[key], delta: first && last && points.length > 1 ? Math.round((last.values[key]! - first.values[key]!) * 10) / 10 : null };
}
