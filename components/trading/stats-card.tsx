"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down";
  icon: React.ElementType;
}

export function StatsCard({ title, value, change, trend, icon: Icon }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-zinc-100 p-2.5 dark:bg-zinc-900">
          <Icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
            trend === "up" ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          )}>
            {change}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
        <h3 className="mt-1 text-2xl font-bold text-black dark:text-white">{value}</h3>
      </div>
    </motion.div>
  );
}
