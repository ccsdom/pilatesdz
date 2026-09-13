import { expect, it, vi } from "vitest";
import { parseCashAmount, paymentInputSchema } from "../../src/domain/models/payment";
import { createPaymentService } from "../../src/services/payments";
it.each([["5000", 500000], ["12,50", 1250], ["0.01", 1], [" 12.5 ", 1250]])("parses %s in exact centimes", (value, amount) => expect(parseCashAmount(value as string)).toBe(amount));
it.each(["0", "-1", "1e3", "1.234", "NaN", "5 000", "", "99999999999999"])("rejects malformed cash amount %s", value => expect(parseCashAmount(value)).toBeNull());
it("enforces cash, integer centimes and real dates", () => {
  const payment = { amountMinor: 100, method: "cash", receivedDate: "2026-09-13" };
  expect(paymentInputSchema.safeParse(payment).success).toBe(true);
  for (const change of [{ amountMinor: 0 }, { amountMinor: 1.2 }, { method: "transfer" }, { receivedDate: "2026-02-30" }, { totalMinor: 1 }]) expect(paymentInputSchema.safeParse({ ...payment, ...change }).success).toBe(false);
});
it("denies customer access and malformed identifiers before persistence", () => {
  const repository = { list: vi.fn(), record: vi.fn(), correct: vi.fn() };
  const service = createPaymentService(repository);
  const actor = { uid: "admin", role: "admin" as const, centerId: "alger" };
  const id = "e15f3c91-434a-4e9c-8056-31a530742a52";
  expect(() => service.list({ ...actor, role: "client" }, "c", id)).toThrow();
  expect(() => service.list(actor, "../other", id)).toThrow();
  expect(() => service.list(actor, "c", id, "bad")).toThrow();
  expect(() => service.record(actor, "c", id, id, { amountMinor: 1, method: "card", receivedDate: "2026-09-13" })).toThrow();
  expect(repository.record).not.toHaveBeenCalled(); expect(repository.list).not.toHaveBeenCalled();
});

it("requires administrator access and a bounded correction reason", () => {
  const repository = { list: vi.fn(), record: vi.fn(), correct: vi.fn() };
  const service = createPaymentService(repository);
  const actor = { uid: "admin", role: "admin" as const, centerId: "alger" };
  const id = "e15f3c91-434a-4e9c-8056-31a530742a52";
  const input = { paymentId: id, reason: "Erreur de montant" };
  expect(() => service.correct({ ...actor, role: "client" }, "c", id, id, input)).toThrow();
  for (const change of [{ reason: "   " }, { reason: "court".repeat(100) }, { paymentId: "../other" }, { amountMinor: -1 }]) {
    expect(() => service.correct(actor, "c", id, id, { ...input, ...change })).toThrow();
  }
  expect(repository.correct).not.toHaveBeenCalled();
  service.correct(actor, "c", id, id, { ...input, reason: "  Erreur de montant  " });
  expect(repository.correct).toHaveBeenCalledWith(actor, "c", id, id, input);
});
