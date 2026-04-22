"use client";

import { useState } from "react";
import { requestAiAnalysis } from "@/app/actions/trading";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

interface AiAnalysisButtonProps {
  accountId: string;
}

export function AiAnalysisButton({ accountId }: AiAnalysisButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    const toastId = toast.loading("AI is analyzing your trading patterns...");

    try {
      const res = await requestAiAnalysis(accountId);
      if (res.success) {
        toast.success("AI Analysis generated successfully! Check the sidebar for results.", { id: toastId });
      } else {
        toast.error(res.error || "Failed to generate analysis", { id: toastId });
      }
    } catch {
      toast.error("An unexpected error occurred during AI analysis", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      disabled={isLoading}
      onClick={handleAnalyze}
      className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      Analyze Performance
    </button>
  );
}
