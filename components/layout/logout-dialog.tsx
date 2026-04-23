"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LogOut, X, Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

export function LogoutDialog({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void 
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-900/20">
                <LogOut className="h-10 w-10" />
              </div>
              <h2 className="mb-2 text-2xl font-black tracking-tight text-black dark:text-white uppercase">Confirm Logout</h2>
              <p className="mb-8 text-sm text-zinc-500 font-medium">Are you sure you want to log out from your TradeAI account? You will need to login again to access your dashboard.</p>
              
              <div className="grid w-full grid-cols-2 gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="rounded-xl border border-zinc-200 px-4 py-3.5 text-xs font-black uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3.5 text-xs font-black uppercase tracking-widest text-white hover:bg-red-700 transition-all"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Logout"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
