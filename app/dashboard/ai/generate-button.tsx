"use client";

import { useState } from "react";
import { generateAIAnalysis } from "@/app/actions/ai";
import { Loader2, Wand2 } from "lucide-react";

export function GenerateButton() {
  const [isPending, setIsPending] = useState(false);

  async function handleGenerate() {
    setIsPending(true);
    try {
      await generateAIAnalysis();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert(error.message || "Failed to generate analysis");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button 
      onClick={handleGenerate}
      disabled={isPending}
      className="flex items-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 disabled:opacity-50"
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyzing Trades...
        </>
      ) : (
        <>
          <Wand2 className="h-4 w-4" />
          Generate New Analysis
        </>
      )}
    </button>
  );
}
