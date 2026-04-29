"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { Wallet } from "lucide-react";

interface Account {
  id: string;
  broker: string;
  accountNumber: string;
  balance: number | null;
  currency: string | null;
}

interface DashboardAccountSelectorProps {
  accounts: Account[];
  currentAccountId: string;
}

export function DashboardAccountSelector({ 
  accounts, 
  currentAccountId 
}: DashboardAccountSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleAccountChange = (accountId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (accountId) {
      params.set("accountId", accountId);
    } else {
      params.delete("accountId");
    }
    
    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`);
    });
  };

  if (accounts.length <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="relative group">
        <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
        <select 
          value={currentAccountId}
          onChange={(e) => handleAccountChange(e.target.value)}
          className="pl-10 pr-10 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-zinc-700 dark:text-zinc-200 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all shadow-sm appearance-none"
        >
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.broker} ({acc.accountNumber})
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
          ▼
        </div>
      </div>
      {isPending && (
        <span className="text-[10px] text-zinc-400 font-mono animate-pulse uppercase tracking-widest">
          Loading...
        </span>
      )}
    </div>
  );
}
