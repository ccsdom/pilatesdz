"use client";

import { useEffect, useState } from "react";
import { offlineAttendanceSync } from "@/lib/offline/offline-attendance-sync";

export interface NetworkStatus {
  isOnline: boolean;
  pendingSyncCount: number;
  syncPendingItems: () => Promise<{ synced: number; failed: number }>;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(
    offlineAttendanceSync.getPendingCount()
  );

  const syncPendingItems = async () => {
    const result = await offlineAttendanceSync.sync(async (item) => {
      try {
        const res = await fetch("/api/presences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: item.sessionId,
            clientId: item.clientId,
            status: item.status,
          }),
        });
        return res.ok;
      } catch {
        return false;
      }
    });

    setPendingSyncCount(offlineAttendanceSync.getPendingCount());
    return result;
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto sync when coming back online
      syncPendingItems();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial sync count check
    setPendingSyncCount(offlineAttendanceSync.getPendingCount());

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    isOnline,
    pendingSyncCount,
    syncPendingItems,
  };
}
