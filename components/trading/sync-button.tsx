"use client";

import { useState } from "react";
import { syncAllAccounts } from "@/app/actions/trading";
import { RefreshCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SyncButton() {
  const [isPending, setIsPending] = useState(false);

  async function handleSync() {
    setIsPending(true);
    try {
      await syncAllAccounts();
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={isPending}
      className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-bold hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 disabled:opacity-50"
    >
      <RefreshCcw className={cn("h-4 w-4", isPending && "animate-spin")} />
      {isPending ? "Syncing..." : "Sync Now"}
    </button>
  );
}
