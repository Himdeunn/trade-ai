"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface HistoryFiltersProps {
  accounts: { id: string; broker: string; accountNumber: string }[];
  currentAccountId: string;
  currentSymbol: string;
  currentType: string;
}

export function HistoryFilters({ 
  accounts, 
  currentAccountId, 
  currentSymbol, 
  currentType 
}: HistoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [symbol, setSymbol] = useState(currentSymbol);

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.set("page", "1");
    
    startTransition(() => {
      router.push(`/dashboard/history?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ symbol });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 shadow-sm">
      {/* Symbol Search */}
      <div className="flex-1 relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
        <form onSubmit={handleSearchSubmit} className="w-full">
          <input 
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Search symbol (e.g. XAUUSD)..."
            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-zinc-100 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          {symbol && (
            <button 
              type="button"
              onClick={() => { setSymbol(""); updateFilters({ symbol: "" }); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X className="h-3 w-3 text-zinc-400" />
            </button>
          )}
        </form>
      </div>
      
      <div className="flex flex-wrap gap-3 items-center">
        {/* Account Selector */}
        <select 
          value={currentAccountId}
          onChange={(e) => updateFilters({ accountId: e.target.value })}
          className="px-4 py-2.5 text-sm rounded-xl border border-zinc-100 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-zinc-700 dark:text-zinc-200"
        >
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.broker} ({acc.accountNumber})
            </option>
          ))}
        </select>
        
        {/* Type Filter */}
        <div className="flex rounded-xl border border-zinc-100 bg-zinc-50 p-1 dark:bg-zinc-900 dark:border-zinc-800">
          <button 
            onClick={() => updateFilters({ type: "" })}
            className={cn(
              "px-4 py-1.5 text-xs font-black rounded-lg transition-all uppercase tracking-tighter",
              !currentType ? "bg-white text-black shadow-sm dark:bg-zinc-800 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            All
          </button>
          <button 
            onClick={() => updateFilters({ type: "buy" })}
            className={cn(
              "px-4 py-1.5 text-xs font-black rounded-lg transition-all uppercase tracking-tighter",
              currentType === "buy" ? "bg-white text-blue-600 shadow-sm dark:bg-zinc-800" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            Buy
          </button>
          <button 
            onClick={() => updateFilters({ type: "sell" })}
            className={cn(
              "px-4 py-1.5 text-xs font-black rounded-lg transition-all uppercase tracking-tighter",
              currentType === "sell" ? "bg-white text-rose-600 shadow-sm dark:bg-zinc-800" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            Sell
          </button>
        </div>
      </div>
      
      {isPending && (
        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono animate-pulse uppercase tracking-widest px-2">
          Refreshing...
        </div>
      )}
    </div>
  );
}
