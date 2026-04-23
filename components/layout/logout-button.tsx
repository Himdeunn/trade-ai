"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { LogoutDialog } from "./logout-dialog";

export function LogoutButton({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center justify-between p-6 rounded-3xl border border-zinc-100 bg-white shadow-sm hover:border-red-200 hover:shadow-md transition-all dark:border-zinc-900 dark:bg-zinc-950 dark:hover:border-red-900 group",
          className
        )}
      >
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 dark:bg-red-900/20">
            <LogOut className="h-8 w-8 text-red-600" />
          </div>
          <div className="space-y-1 text-left">
            <h3 className="text-lg font-black uppercase tracking-tight text-red-600">Sign Out</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">End your current session securely.</p>
          </div>
        </div>
      </button>

      <LogoutDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
