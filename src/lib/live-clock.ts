/** One timer per clock, regardless of the number of mounted consumers. */
export function createLiveClock() {
  let now = Date.now();
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setInterval> | undefined;
  const tick = () => {
    const next = Date.now();
    if (next === now) return;
    now = next;
    listeners.forEach(listener => listener());
  };
  return {
    getSnapshot: () => now,
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (listeners.size === 1) {
        timer = setInterval(tick, 1000);
        window.addEventListener("focus", tick);
        document.addEventListener("visibilitychange", tick);
        tick();
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          clearInterval(timer);
          window.removeEventListener("focus", tick);
          document.removeEventListener("visibilitychange", tick);
        }
      };
    },
  };
}
