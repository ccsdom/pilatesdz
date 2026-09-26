import { describe, expect, it, beforeEach } from "vitest";
import { OfflineAttendanceSyncManager } from "@/lib/offline/offline-attendance-sync";

describe("OfflineAttendanceSyncManager", () => {
  let manager: OfflineAttendanceSyncManager;

  beforeEach(() => {
    manager = new OfflineAttendanceSyncManager();
    manager.clearQueue();
  });

  it("starts with an empty queue", () => {
    expect(manager.getPendingCount()).toBe(0);
    expect(manager.getQueue()).toEqual([]);
  });

  it("enqueues an attendance marking", () => {
    const item = manager.enqueue({
      sessionId: "session_101",
      clientId: "client_202",
      status: "present",
    });

    expect(item.sessionId).toBe("session_101");
    expect(item.clientId).toBe("client_202");
    expect(item.status).toBe("present");
    expect(manager.getPendingCount()).toBe(1);
  });

  it("deduplicates attendance entries for the same session and client", () => {
    manager.enqueue({
      sessionId: "session_101",
      clientId: "client_202",
      status: "present",
    });

    // Update status to absent for same session and client
    manager.enqueue({
      sessionId: "session_101",
      clientId: "client_202",
      status: "absent",
    });

    expect(manager.getPendingCount()).toBe(1);
    expect(manager.getQueue()[0].status).toBe("absent");
  });

  it("syncs queued items using a sync callback", async () => {
    manager.enqueue({
      sessionId: "session_101",
      clientId: "client_202",
      status: "present",
    });

    const mockSyncFn = async () => true;
    const result = await manager.sync(mockSyncFn);

    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);
    expect(manager.getPendingCount()).toBe(0);
  });

  it("retains failed items in queue for retry", async () => {
    manager.enqueue({
      sessionId: "session_101",
      clientId: "client_202",
      status: "present",
    });

    const mockSyncFn = async () => false;
    const result = await manager.sync(mockSyncFn);

    expect(result.synced).toBe(0);
    expect(result.failed).toBe(1);
    expect(manager.getPendingCount()).toBe(1);
    expect(manager.getQueue()[0].retryCount).toBe(1);
  });
});
