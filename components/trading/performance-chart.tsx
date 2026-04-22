"use client";

import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  CartesianGrid
} from "recharts";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const formattedLabel = typeof label === 'number' 
      ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(label))
      : label;

    return (
      <div className="rounded-xl border border-zinc-200 bg-white/90 p-3 shadow-2xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
        <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">{formattedLabel}</p>
        <p className="text-sm font-bold text-blue-600">
          ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function PerformanceChart({ data }: { data: any[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentRange = searchParams.get("range") || "1M";

  function setRange(range: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-[400px] w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-black dark:text-white">Growth Performance</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Equity growth over time</p>
        </div>
        <div className="flex gap-2 bg-zinc-100 p-1 rounded-lg dark:bg-zinc-900">
          {['1M', '3M', '6M', 'All'].map((t) => (
            <button 
              key={t} 
              onClick={() => setRange(t)}
              className={`rounded-md px-3 py-1 text-xs font-bold transition-all ${
                currentRange === t 
                  ? "bg-white shadow-sm text-black dark:bg-zinc-800 dark:text-white" 
                  : "text-zinc-500 hover:text-black dark:hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#88888822" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#888' }}
            dy={10}
            tickFormatter={(val) => {
              if (typeof val === 'number') {
                return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(val));
              }
              return val;
            }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#888' }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="equity"
            stroke="#3b82f6"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorProfit)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
