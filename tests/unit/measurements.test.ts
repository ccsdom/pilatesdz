import { expect, it, vi } from "vitest";
import { measurementEvolution, measurementInputSchema, isMeasurementDayAllowed, type Measurement } from "../../src/domain/models/measurements";
import { createMeasurementService } from "../../src/services/measurements";
import type { Access } from "../../src/domain/models/access";
const actor: Access = { uid: "admin", centerId: "alger", role: "admin" };
const input = { day: "2026-01-01", values: { weight: 65.2 } };
it.each([{}, { weight: 0 }, { weight: -1 }, { waist: 301 }, { weight: 65.22 }, { arm: NaN }, { weight: "65" }, { role: "admin", weight: 65 }])("rejects invalid or empty measurements %j", values => {
  expect(measurementInputSchema.safeParse({ ...input, values }).success).toBe(false);
});
it("validates real dates and the current day in Alger", () => {
  expect(measurementInputSchema.safeParse(input).success).toBe(true);
  expect(measurementInputSchema.safeParse({ ...input, day: "2026-02-30" }).success).toBe(false);
  expect(isMeasurementDayAllowed("2026-09-21", Date.parse("2026-09-20T23:30:00Z"))).toBe(true);
  expect(isMeasurementDayAllowed("2026-09-22", Date.parse("2026-09-20T23:30:00Z"))).toBe(false);
});
it("blocks unauthorized access and invalid requests before touching storage", () => {
  const repository = { list: vi.fn(), save: vi.fn() };
  const service = createMeasurementService(repository);
  expect(() => service.list({ ...actor, role: "client" }, "client")).toThrow();
  expect(() => service.save({ ...actor, role: "client" }, "client", input, 0)).toThrow();
  expect(() => service.list(actor, "../other")).toThrow();
  expect(() => service.list(actor, "client", "bad-cursor")).toThrow();
  expect(() => service.save(actor, "client", { ...input, centerId: "other" }, 0)).toThrow();
  expect(() => service.save(actor, "client", { ...input, day: "2999-01-01" }, 0)).toThrow();
  expect(() => service.save(actor, "client", input, -1)).toThrow();
  expect(repository.list).not.toHaveBeenCalled(); expect(repository.save).not.toHaveBeenCalled();
  service.save(actor, "client", input, 2);
  expect(repository.save).toHaveBeenCalledWith(actor, "client", input, 2);
});
it("compares chronological values without interpreting missing measurements as zero", () => {
  const records = [{ day: "2026-03-01", values: { weight: 64.1 } }, { day: "2026-04-01", values: { waist: 80 } }, { day: "2026-01-01", values: { weight: 65.2 } }] as Measurement[];
  const result = measurementEvolution(records, "weight");
  expect(result.latest).toBe(64.1); expect(result.delta).toBe(-1.1);
  expect(result.points.map(point => point.day)).toEqual(["2026-01-01", "2026-03-01"]);
  expect(measurementEvolution(records, "waist").delta).toBe(null);
  expect(measurementEvolution(records, "height").latest).toBeUndefined();
});
