"use client";

import { useState } from "react";
import { Eraser, Loader2 } from "lucide-react";
import { clearAccountHistory } from "@/app/actions/trading";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ClearHistoryButton({ accountId }: { accountId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleClear = async () => {
    setIsLoading(true);
    try {
      const res = await clearAccountHistory(accountId);
      if (res.success) {
        toast.success("Trade history cleared successfully.");
        setShowConfirm(false);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to clear history.");
      }
    } catch (err) {
      toast.error("An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase text-red-500 animate-pulse">Are you sure?</span>
        <button 
          onClick={handleClear}
          disabled={isLoading}
          className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-1 shadow-lg shadow-red-500/20"
        >
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes, Clear"}
        </button>
        <button 
          onClick={() => setShowConfirm(false)}
          disabled={isLoading}
          className="text-zinc-500 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={() => setShowConfirm(true)}
      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-300 transition-all"
    >
      <Eraser className="h-3.5 w-3.5" />
      Clear History
    </button>
  );
}
