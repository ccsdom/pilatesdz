"use client";

import { useNetworkStatus } from "@/hooks/use-network-status";
import { useState } from "react";

export function OfflineBanner() {
  const { isOnline, pendingSyncCount, syncPendingItems } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);

  if (isOnline && pendingSyncCount === 0) {
    return null;
  }

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncPendingItems();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 flex items-center justify-between shadow-sm ${
        !isOnline
          ? "bg-amber-500/15 border-b border-amber-500/30 text-amber-200"
          : "bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-200"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            !isOnline ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
          }`}
        />
        <span>
          {!isOnline
            ? "Mode Hors-Ligne actif — Les présences enregistrées seront synchronisées automatiquement dès le retour d'Internet."
            : `${pendingSyncCount} élément(s) en attente de synchronisation.`}
        </span>
      </div>

      {isOnline && pendingSyncCount > 0 && (
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="ml-4 px-3 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
        >
          {isSyncing ? "Synchronisation..." : "Synchroniser maintenant"}
        </button>
      )}
    </div>
  );
}
