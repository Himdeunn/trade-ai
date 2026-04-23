"use client";

import { Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SecurityProgressProps {
  score: number;
  suggestions: string[];
}

export function SecurityProgress({ score, suggestions }: SecurityProgressProps) {
  return (
    <div className="rounded-3xl border border-zinc-100 bg-zinc-900 p-6 text-white shadow-xl dark:bg-zinc-900/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Shield className={cn(
            "h-5 w-5",
            score < 50 ? "text-red-500" : score < 80 ? "text-amber-500" : "text-green-500"
          )} />
          <h4 className="font-bold tracking-tight uppercase text-[10px] tracking-widest">Account Security</h4>
        </div>
        <span className="text-xl font-black">{score}%</span>
      </div>

      <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden mb-6">
        <div 
          className={cn(
            "h-full transition-all duration-1000 ease-out",
            score < 50 ? "bg-red-500" : score < 80 ? "bg-amber-500" : "bg-green-500"
          )}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Suggestions</p>
        {suggestions.length === 0 ? (
          <div className="flex items-center gap-2 text-[10px] font-bold text-green-400 uppercase tracking-tight">
            <CheckCircle2 className="h-3 w-3" />
            Your account is fully secured
          </div>
        ) : (
          suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-[10px] font-bold text-zinc-300 uppercase tracking-tight">
              <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
              {s}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
