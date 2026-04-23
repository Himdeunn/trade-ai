import { auth } from "@/auth";
import { db } from "@/lib/db";
import { trades } from "@/lib/db/schema";
import { desc, and, eq, gte } from "drizzle-orm";
import { StatsCard } from "@/components/trading/stats-card";
import { PerformanceChart } from "@/components/trading/performance-chart";
import { 
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { SyncButton } from "@/components/trading/sync-button";
import { AiAnalysisButton } from "@/components/trading/ai-analysis-button";
import { getCurrencySymbol, formatCurrency } from "@/lib/currency-utils";

export default async function DashboardPage(props: {
  searchParams: Promise<{ range?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();
  
  if (!session?.user?.id) {
    return null; // Layout handles redirect
  }

  const range = searchParams.range || "1M";
  const userId = session.user.id as string;
  const account = await db.query.tradingAccounts.findFirst({
    where: (table, { eq }) => eq(table.userId, userId),
  });

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="bg-zinc-100 dark:bg-zinc-900 p-8 rounded-3xl mb-8">
          <Wallet className="h-16 w-16 text-zinc-400" />
        </div>
        <h2 className="text-3xl font-bold mb-3 text-black dark:text-white">No Trading Account Linked</h2>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-10 text-lg">
          Connect your MetaTrader account via MetaApi to start tracking your performance automatically.
        </p>
        <Link href="/dashboard/settings" className="bg-black dark:bg-white text-white dark:text-black px-10 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-transform shadow-xl">
          Link Account Now
        </Link>
      </div>
    );
  }

  // Calculate date filter
  let dateFilter = new Date();
  if (range === "1M") dateFilter.setMonth(dateFilter.getMonth() - 1);
  else if (range === "3M") dateFilter.setMonth(dateFilter.getMonth() - 3);
  else if (range === "6M") dateFilter.setMonth(dateFilter.getMonth() - 6);
  else dateFilter = new Date(0);

  // Fetch all transactions for balance and lifetime stats
  const allTransactions = await db.query.trades.findMany({
    where: eq(trades.accountId, account.id),
    orderBy: [desc(trades.openTime)],
  });

  // Filter only actual trades (buy/sell) for performance stats
  const allAccountTrades = allTransactions.filter(t => t.type === "buy" || t.type === "sell");
  
  // Filter for selected range (trades only)
  const accountTrades = allAccountTrades.filter(t => t.openTime >= dateFilter);

  const totalTrades = accountTrades.length;
  const lifetimeTradingProfit = allAccountTrades.reduce((acc, t) => acc + (t.profit || 0), 0);
  const rangeTradingProfit = accountTrades.reduce((acc, t) => acc + (t.profit || 0), 0);
  
  // Total balance = Sum of ALL transactions (including deposits/withdrawals)
  const calculatedBalance = allTransactions.reduce((acc, t) => acc + (t.profit || 0) + (t.commission || 0) + (t.swap || 0), 0);
  
  const winRate = accountTrades.length > 0 
    ? (accountTrades.filter(t => (t.profit || 0) > 0).length / accountTrades.length) * 100 
    : 0;

  // Calculate profit factor for the selected range (trades only)
  const winningTrades = accountTrades.filter(t => (t.profit || 0) > 0);
  const losingTrades = accountTrades.filter(t => (t.profit || 0) < 0);
  const grossProfit = winningTrades.reduce((acc, t) => acc + (t.profit || 0), 0);
  const grossLoss = Math.abs(losingTrades.reduce((acc, t) => acc + (t.profit || 0), 0));
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : (grossProfit > 0 ? 100 : 0);

  // Growth calculation (Lifetime Trading Profit / Total Deposits)
  const totalDeposits = allTransactions
    .filter(t => t.type === "deposit")
    .reduce((acc, t) => acc + (t.profit || 0), 0);
  
  const growthPercentage = totalDeposits > 0 
    ? (lifetimeTradingProfit / totalDeposits) * 100 
    : (lifetimeTradingProfit > 0 ? 100 : 0);

  // Simple equity curve for chart (using all transactions to show actual balance movement)
  let runningBalance = calculatedBalance;
  const chartData = [{ date: Date.now(), equity: runningBalance }];
  allTransactions.slice(0, 50).forEach((t) => {
    runningBalance -= ((t.profit || 0) + (t.commission || 0) + (t.swap || 0));
    chartData.unshift({
      date: t.openTime.getTime(),
      equity: runningBalance
    });
  });

  const currency = account.currency || "USD";
  const symbol = getCurrencySymbol(currency);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">Dashboard Overview</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Welcome back, {session.user.name}. Here&apos;s what&apos;s happening with your trading.</p>
        </div>
        <div className="flex items-center gap-3">
          <AiAnalysisButton accountId={account.id} />
          <SyncButton />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Account Balance" 
          value={formatCurrency(calculatedBalance, currency)} 
          change={`${rangeTradingProfit >= 0 ? "+" : ""}${formatCurrency(rangeTradingProfit, currency)}`} 
          trend={rangeTradingProfit >= 0 ? "up" : "down"} 
          iconName="wallet" 
        />
        <StatsCard 
          title="Growth (Lifetime)" 
          value={`${growthPercentage >= 0 ? "+" : ""}${growthPercentage.toFixed(1)}%`} 
          change={`${lifetimeTradingProfit >= 0 ? "+" : ""}${formatCurrency(lifetimeTradingProfit, currency)}`}
          trend={lifetimeTradingProfit >= 0 ? "up" : "down"} 
          iconName="trending" 
        />
        <StatsCard 
          title="Win Rate" 
          value={`${winRate.toFixed(1)}%`} 
          change={`${totalTrades} trades`} 
          trend={winRate >= 50 ? "up" : "down"} 
          iconName="pie" 
        />
        <StatsCard 
          title="Profit Factor" 
          value={profitFactor.toFixed(2)} 
          change={range} 
          trend={profitFactor >= 1 ? "up" : "down"} 
          iconName="bar" 
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PerformanceChart data={chartData} />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="text-lg font-bold mb-4 text-black dark:text-white">Recent Trades</h3>
          <div className="space-y-4">
            {accountTrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="h-12 w-12 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mb-4">
                  <History className="h-6 w-6 text-zinc-400" />
                </div>
                <p className="text-sm text-zinc-500">No recent trades found.</p>
                <p className="text-xs text-zinc-400">Click sync to fetch history.</p>
              </div>
            ) : (
              accountTrades.slice(0, 5).map((trade) => (
                <div key={trade.id} className="flex items-center justify-between border-b border-zinc-50 pb-4 last:border-0 dark:border-zinc-900">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      (trade.profit || 0) > 0 ? "bg-green-50 text-green-600 dark:bg-green-900/20" : "bg-red-50 text-red-600 dark:bg-red-900/20"
                    )}>
                      {(trade.profit || 0) > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-black dark:text-white">{trade.symbol}</p>
                      <p className="text-xs text-zinc-500 uppercase">{trade.type} • {trade.volume} Lot</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-bold",
                      (trade.profit || 0) > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {(trade.profit || 0) > 0 ? "+" : ""}{formatCurrency(trade.profit || 0, currency)}
                    </p>
                    <p className="text-xs text-zinc-500">{trade.openTime.toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <Link href="/dashboard/history" className="mt-6 block w-full rounded-xl border border-zinc-100 py-3 text-center text-sm font-bold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-all">
            View All History
          </Link>
        </div>
      </div>
    </div>
  );
}
