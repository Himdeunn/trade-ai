"use client";

import { Search, User } from "lucide-react";
import { NotificationBell } from "./notification-bell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Header({ user }: { user: any }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-8 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96 group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-600 transition-colors" />
          <input
            type="text"
            placeholder="Search trades, pairs, or analysis..."
            className="w-full rounded-xl border-none bg-zinc-100 py-2.5 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 dark:bg-zinc-900 transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-black dark:text-white">{user?.name || "Trader"}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{user?.email}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
            <User className="h-6 w-6 text-zinc-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
