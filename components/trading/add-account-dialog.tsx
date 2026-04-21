"use client";

import { useState } from "react";
import { linkTradingAccount } from "@/app/actions/trading";
import { Plus, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AddAccountDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await linkTradingAccount(formData);

    if (result.success) {
      setIsOpen(false);
    } else {
      setError(result.error || "Failed to link account");
    }
    setIsPending(false);
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition-transform active:scale-95 dark:bg-white dark:text-black"
      >
        <Plus className="h-5 w-5" />
        Add Account
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute right-6 top-6 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-2xl font-bold mb-1">Link Account</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mb-8">Connect your MetaTrader account via MetaApi.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Broker Name (Label)</label>
                  <input 
                    name="name" 
                    required 
                    placeholder="e.g. IC Markets - Challenge"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-900" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Account Number</label>
                    <input 
                      name="login" 
                      required 
                      placeholder="123456"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-900" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Platform</label>
                    <select 
                      name="platform" 
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <option value="mt4">MT4</option>
                      <option value="mt5">MT5</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Server Name</label>
                  <input 
                    name="server" 
                    required 
                    placeholder="ICMarkets-Demo"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-900" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">Investor Password</label>
                  <input 
                    name="password" 
                    type="password" 
                    required 
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-900" 
                  />
                </div>

                {error && (
                  <p className="text-sm font-medium text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">{error}</p>
                )}

                <button 
                  disabled={isPending}
                  className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Connecting...
                    </>
                  ) : "Link Account"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
