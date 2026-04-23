"use client";

import { User, Settings, LogOut, ChevronDown, ShieldCheck, CreditCard } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogoutDialog } from "./logout-dialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function UserNav({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 rounded-2xl p-1.5 pr-3 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-900",
          isOpen && "bg-zinc-100 dark:bg-zinc-900"
        )}
      >
        <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border-2 border-white dark:border-zinc-950 shadow-md overflow-hidden">
          {user?.avatar ? (
            <img src={`/avatars/${user.avatar}.png`} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
          )}
        </div>
        <div className="text-left hidden lg:block">
          <p className="text-xs font-black uppercase tracking-tight text-black dark:text-white leading-none mb-1">
            {user?.name || "Trader"}
          </p>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Pro Account</p>
          </div>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-zinc-400 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-64 z-50 rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="px-3 py-4 border-b border-zinc-100 dark:border-zinc-900 mb-2">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Logged in as</p>
                <p className="text-sm font-black text-black dark:text-white truncate">{user?.email}</p>
              </div>

              <div className="space-y-1">
                <Link 
                  href="/dashboard/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-50 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-blue-400 transition-all"
                >
                  <ShieldCheck className="h-4 w-4" />
                  My Profile
                </Link>
                <Link 
                  href="/dashboard/account"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-50 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-blue-400 transition-all"
                >
                  <CreditCard className="h-4 w-4" />
                  My Account
                </Link>
                <Link 
                  href="/dashboard/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-50 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-blue-400 transition-all"
                >
                  <Settings className="h-4 w-4" />
                  Settings Hub
                </Link>
              </div>

              <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    setIsLogoutOpen(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <LogoutDialog isOpen={isLogoutOpen} onClose={() => setIsLogoutOpen(false)} />
    </div>
  );
}
