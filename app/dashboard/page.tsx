import { auth } from "@/auth";
import { db } from "@/lib/db";
import { trades, tradingAccounts } from "@/lib/db/schema";
import { eq, desc, sum } from "drizzle-orm";
import { StatsCard } from "@/components/trading/stats-card";
import { PerformanceChart } from "@/components/trading/performance-chart";
import { 
  Wallet, 
  TrendingUp, 
  PieChart, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  
  // Get primary account
  const userId = session!.user!.id as string;
  const account = await db.query.tradingAccounts.findFirst({
    where: (table, { eq }) => eq(table.userId, userId),
  });

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="bg-zinc-100 dark:bg-zinc-900 p-6 rounded-full mb-6">
          <Wallet className="h-12 w-12 text-zinc-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No Trading Account Linked</h2>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mb-8">
          Connect your MetaTrader account via MetaApi to start tracking your performance automatically.
        </p>
        <button className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-xl font-bold">
          Link Account Now
        </button>
      </div>
    );
  }

  // Fetch stats
  const accountTrades = await db.query.trades.findMany({
    where: (table, { eq }) => eq(table.accountId, account.id),
    orderBy: [desc(trades.openTime)],
  });

  const totalProfit = accountTrades.reduce((acc, t) => acc + (t.profit || 0), 0);
  const winRate = accountTrades.length > 0 
    ? (accountTrades.filter(t => (t.profit || 0) > 0).length / accountTrades.length) * 100 
    : 0;

  // Mock chart data for now (or calculate from history)
  const chartData = [
    { date: "Mon", equity: 10000 },
    { date: "Tue", equity: 10200 },
    { date: "Wed", equity: 10150 },
    { date: "Thu", equity: 10500 },
    { date: "Fri", equity: 10800 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">Dashboard Overview</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Welcome back, {session?.user?.name}. Here's what's happening with your trading.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Total Balance" 
          value="$10,800.50" 
          change="+12.5%" 
          trend="up" 
          icon={Wallet} 
        />
        <StatsCard 
          title="Total Profit" 
          value={`$${totalProfit.toLocaleString()}`} 
          change="+$450" 
          trend="up" 
          icon={TrendingUp} 
        />
        <StatsCard 
          title="Win Rate" 
          value={`${winRate.toFixed(1)}%`} 
          change="-2.1%" 
          trend="down" 
          icon={PieChart} 
        />
        <StatsCard 
          title="Profit Factor" 
          value="1.85" 
          change="+0.2" 
          trend="up" 
          icon={BarChart3} 
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PerformanceChart data={chartData} />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="text-lg font-bold mb-4">Recent Trades</h3>
          <div className="space-y-4">
            {accountTrades.slice(0, 5).map((trade) => (
              <div key={trade.id} className="flex items-center justify-between border-b border-zinc-50 pb-4 last:border-0 dark:border-zinc-900">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    (trade.profit || 0) > 0 ? "bg-green-50 text-green-600 dark:bg-green-900/20" : "bg-red-50 text-red-600 dark:bg-red-900/20"
                  )}>
                    {(trade.profit || 0) > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{trade.symbol}</p>
                    <p className="text-xs text-zinc-500 uppercase">{trade.type} • {trade.volume} Lot</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-bold",
                    (trade.profit || 0) > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {(trade.profit || 0) > 0 ? "+" : ""}${trade.profit?.toFixed(2)}
                  </p>
                  <p className="text-xs text-zinc-500">{trade.openTime.toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full text-sm font-medium text-zinc-500 hover:text-black dark:hover:text-white">
            View All History
          </button>
        </div>
      </div>
    </div>
  );
}
