"use client";

import { Search, LayoutDashboard, History, BrainCircuit, TrendingUp, Settings, User, CreditCard, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const PAGES = [
  { title: "Dashboard", desc: "Overview of your trading performance and analytics.", href: "/dashboard", icon: LayoutDashboard },
  { title: "Trade History", desc: "Detailed log of all your past trades and transactions.", href: "/dashboard/history", icon: History },
  { title: "AI Analysis", desc: "AI-powered psychological and performance reviews.", href: "/dashboard/ai", icon: BrainCircuit },
  { title: "Performance Metrics", desc: "In-depth statistics, growth charts, and profit factors.", href: "/dashboard/performance", icon: TrendingUp },
  { title: "Settings Hub", desc: "Manage accounts, security, and notification preferences.", href: "/dashboard/settings", icon: Settings },
  { title: "My Profile", desc: "Update your personal information and profile picture.", href: "/dashboard/profile", icon: User },
  { title: "My Account", desc: "Manage your trading accounts, keys, and subscription.", href: "/dashboard/account", icon: CreditCard },
];

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredPages = query === "" 
    ? [] 
    : PAGES.filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase()) || 
        p.desc.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative w-96 group" ref={searchRef}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-600 transition-colors" />
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search pages (Ctrl + K)..."
        className="w-full rounded-xl border-none bg-zinc-100 py-2.5 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 dark:bg-zinc-900 transition-all"
      />
      
      <AnimatePresence>
        {isOpen && query !== "" && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="p-2">
                {filteredPages.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No pages found</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredPages.map((page) => (
                      <Link
                        key={page.href}
                        href={page.href}
                        onClick={() => {
                          setQuery("");
                          setIsOpen(false);
                        }}
                        className="flex items-start gap-4 rounded-xl p-3 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 group/item"
                      >
                        <div className="mt-1 rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800 group-hover/item:bg-blue-600 group-hover/item:text-white transition-colors">
                          <page.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight text-black dark:text-white group-hover/item:text-blue-600 transition-colors">{page.title}</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1">{page.desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-zinc-50/50 dark:bg-zinc-900/50 p-3 border-t border-zinc-100 dark:border-zinc-900">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 text-center">Search results for "{query}"</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
