import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createLiveClock } from "../../src/lib/live-clock";
import { sessionPhase } from "../../src/domain/models/planning";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-25T09:59:59Z"));
  vi.stubGlobal("window", new EventTarget());
  vi.stubGlobal("document", new EventTarget());
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("changes session phase at its start and end without a page reload", () => {
  const clock = createLiveClock();
  const session = { startsAt: Date.now() + 1000, durationMinutes: 60, status: "scheduled" as const };
  const stop = clock.subscribe(() => {});
  expect(sessionPhase(session, clock.getSnapshot())).toBe("upcoming");
  vi.advanceTimersByTime(1000);
  expect(sessionPhase(session, clock.getSnapshot())).toBe("ongoing");
  vi.advanceTimersByTime(3600000);
  expect(sessionPhase(session, clock.getSnapshot())).toBe("ended");
  stop();
});

it("shares its timer and releases it only after the last consumer leaves", () => {
  const clock = createLiveClock();
  const first = vi.fn(), second = vi.fn();
  const stopFirst = clock.subscribe(first), stopSecond = clock.subscribe(second);
  expect(vi.getTimerCount()).toBe(1);
  vi.advanceTimersByTime(1000);
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(1);
  stopFirst();
  vi.advanceTimersByTime(1000);
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(2);
  stopSecond();
  expect(vi.getTimerCount()).toBe(0);
  vi.setSystemTime(Date.now() + 1000);
  window.dispatchEvent(new Event("focus"));
  document.dispatchEvent(new Event("visibilitychange"));
  expect(second).toHaveBeenCalledTimes(2);
});

it.each(["focus", "visibilitychange"])("catches up immediately on %s after browser suspension", event => {
  const clock = createLiveClock();
  const listener = vi.fn();
  const stop = clock.subscribe(listener);
  vi.setSystemTime(Date.now() + 7200000);
  (event === "focus" ? window : document).dispatchEvent(new Event(event));
  expect(clock.getSnapshot()).toBe(Date.now());
  expect(listener).toHaveBeenCalledTimes(1);
  stop();
});

it("resumes with fresh time after unmount and remount", () => {
  const clock = createLiveClock();
  clock.subscribe(() => {})();
  vi.setSystemTime(Date.now() + 86400000);
  const stop = clock.subscribe(() => {});
  expect(clock.getSnapshot()).toBe(Date.now());
  expect(vi.getTimerCount()).toBe(1);
  stop();
});
