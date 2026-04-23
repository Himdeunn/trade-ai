"use client";

import { GlobalSearch } from "./global-search";
import { UserNav } from "./user-nav";
import { NotificationBell } from "./notification-bell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Header({ user }: { user: any }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-8 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-4 flex-1">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-6">
        <NotificationBell />
        <div className="h-8 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
        <UserNav user={user} />
      </div>
    </header>
  );
}
