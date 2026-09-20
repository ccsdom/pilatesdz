import type { Access } from "../models/access";
import type { Measurement, MeasurementInput, MeasurementPage } from "../models/measurements";
export interface MeasurementRepository {
  list(actor: Access, clientId: string, after?: string): Promise<MeasurementPage>;
  save(actor: Access, clientId: string, input: MeasurementInput, version: number): Promise<Measurement>;
}
