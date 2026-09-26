export interface PendingAttendanceItem {
  id: string; // Unique queue ID
  sessionId: string;
  clientId: string;
  status: "present" | "absent" | "excused";
  timestamp: number;
  retryCount: number;
}

const STORAGE_KEY = "pilates_offline_attendance_queue_v1";

export class OfflineAttendanceSyncManager {
  private queue: PendingAttendanceItem[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.queue = JSON.parse(raw);
      }
    } catch {
      this.queue = [];
    }
  }

  private save(): void {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch {
      /* Ignore quota errors */
    }
  }

  /**
   * Enqueues an attendance marking. Deduplicates by sessionId + clientId.
   */
  enqueue(
    item: Omit<PendingAttendanceItem, "id" | "timestamp" | "retryCount">
  ): PendingAttendanceItem {
    const existingIndex = this.queue.findIndex(
      (q) => q.sessionId === item.sessionId && q.clientId === item.clientId
    );

    const record: PendingAttendanceItem = {
      id: `${item.sessionId}_${item.clientId}_${Date.now()}`,
      sessionId: item.sessionId,
      clientId: item.clientId,
      status: item.status,
      timestamp: Date.now(),
      retryCount: 0,
    };

    if (existingIndex >= 0) {
      this.queue[existingIndex] = record;
    } else {
      this.queue.push(record);
    }

    this.save();
    return record;
  }

  getQueue(): PendingAttendanceItem[] {
    return [...this.queue];
  }

  getPendingCount(): number {
    return this.queue.length;
  }

  clearQueue(): void {
    this.queue = [];
    this.save();
  }

  /**
   * Attempts to sync all queued attendance markings using a sync callback.
   */
  async sync(
    syncFn: (item: PendingAttendanceItem) => Promise<boolean>
  ): Promise<{ synced: number; failed: number }> {
    if (this.queue.length === 0) {
      return { synced: 0, failed: 0 };
    }

    const currentItems = [...this.queue];
    let synced = 0;
    let failed = 0;
    const remaining: PendingAttendanceItem[] = [];

    for (const item of currentItems) {
      try {
        const success = await syncFn(item);
        if (success) {
          synced++;
        } else {
          failed++;
          remaining.push({ ...item, retryCount: item.retryCount + 1 });
        }
      } catch {
        failed++;
        remaining.push({ ...item, retryCount: item.retryCount + 1 });
      }
    }

    this.queue = remaining;
    this.save();

    return { synced, failed };
  }
}

export const offlineAttendanceSync = new OfflineAttendanceSyncManager();
