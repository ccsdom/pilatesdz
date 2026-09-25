"use client";

import { useSyncExternalStore } from "react";
import { createLiveClock } from "@/lib/live-clock";

const clock = createLiveClock();

/** Preserve the server render during hydration; then keep display time current. */
export function usePlanningTime(initialTime: number) {
  return useSyncExternalStore(clock.subscribe, clock.getSnapshot, () => initialTime);
}
