"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  History, 
  BrainCircuit, 
  Settings, 
  TrendingUp,
  PlusCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AddAccountDialog } from "@/components/trading/add-account-dialog";

const items = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Trade History", href: "/dashboard/history", icon: History },
  { name: "AI Analysis", href: "/dashboard/ai", icon: BrainCircuit },
  { name: "Performance", href: "/dashboard/performance", icon: TrendingUp },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:flex">
      <div className="flex h-16 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tighter text-black dark:text-white">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl">TradeAI</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                pathname === item.href
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-black dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
              )}
            >
              <item.icon className={cn(
                "mr-3 h-5 w-5 transition-colors",
                pathname === item.href ? "text-blue-600 dark:text-blue-400" : "text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
              )} />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      <div className="p-4 mt-auto">
        <AddAccountDialog />
      </div>
    </div>
  );
}
