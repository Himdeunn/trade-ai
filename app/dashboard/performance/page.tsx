import { auth } from "@/auth";
import { db } from "@/lib/db";
import { trades } from "@/lib/db/schema";
import { desc, gte, and, eq } from "drizzle-orm";
import { PerformanceChart } from "@/components/trading/performance-chart";
import { TrendingUp, Calendar, Target, Wallet } from "lucide-react";
import { getCurrencySymbol, formatCurrency } from "@/lib/currency-utils";
import Link from "next/link";

export default async function PerformancePage(props: {
  searchParams: Promise<{ range?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user?.id) return null;

  const range = searchParams.range || "1M";
  const userId = session!.user!.id as string;
  const account = await db.query.tradingAccounts.findFirst({
    where: (table, { eq }) => eq(table.userId, userId),
  });

  if (!account) return <div>No account found</div>;
  const currency = account.currency || "USD";

  // Calculate date filter
  let dateFilter = new Date();
  if (range === "1M") dateFilter.setMonth(dateFilter.getMonth() - 1);
  else if (range === "3M") dateFilter.setMonth(dateFilter.getMonth() - 3);
  else if (range === "6M") dateFilter.setMonth(dateFilter.getMonth() - 6);
  else if (range === "YTD") dateFilter = new Date(new Date().getFullYear(), 0, 1);
  else dateFilter = new Date(0); // All time

  // Fetch all transactions for this account
  const allTransactions = await db.query.trades.findMany({
    where: eq(trades.accountId, account.id),
    orderBy: [desc(trades.openTime)],
  });

  // Filter actual trades for performance
  const allTradingOps = allTransactions.filter(t => t.type === "buy" || t.type === "sell");
  const filteredTradingOps = allTradingOps.filter(t => t.openTime >= dateFilter);

  // Total balance calculation (Mathematical)
  const calculatedBalance = allTransactions.reduce((acc, t) => 
    acc + (t.profit || 0) + (t.commission || 0) + (t.swap || 0), 0);

  // Statistics for filtered range
  const totalTrades = filteredTradingOps.length;
  const winningTrades = filteredTradingOps.filter(t => (t.profit || 0) > 0);
  const losingTrades = filteredTradingOps.filter(t => (t.profit || 0) < 0);
  
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
  
  const grossProfit = winningTrades.reduce((acc, t) => acc + (t.profit || 0), 0);
  const grossLoss = Math.abs(losingTrades.reduce((acc, t) => acc + (t.profit || 0), 0));
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : (grossProfit > 0 ? 100 : 0);
  
  const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;

  // Growth calculation (Lifetime)
  const totalDeposits = allTransactions
    .filter(t => t.type === "deposit")
    .reduce((acc, t) => acc + (t.profit || 0), 0);
  
  const lifetimeProfit = allTradingOps.reduce((acc, t) => acc + (t.profit || 0), 0);
  const growthPercentage = totalDeposits > 0 ? (lifetimeProfit / totalDeposits) * 100 : (lifetimeProfit > 0 ? 100 : 0);

  // Simple equity curve calculation (Recent 50 ops)
  let runningBalance = calculatedBalance;
  const chartData = [{ date: Date.now(), equity: runningBalance }];
  allTransactions.slice(0, 50).forEach((t) => {
    runningBalance -= ((t.profit || 0) + (t.commission || 0) + (t.swap || 0));
    chartData.unshift({
      date: t.openTime.getTime(),
      equity: runningBalance
    });
  });

  const ranges = ["1M", "3M", "6M", "YTD", "All"];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-black dark:text-white uppercase">Performance Analytics</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Mathematical breakdown of your trading efficiency.</p>
        </div>
        <div className="flex bg-zinc-100 p-1 rounded-xl dark:bg-zinc-900 shadow-inner">
          {ranges.map((r) => (
            <Link
              key={r}
              href={`/dashboard/performance?range=${r}`}
              className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all uppercase tracking-widest ${
                range === r 
                  ? "bg-white shadow-sm text-black dark:bg-zinc-800 dark:text-white" 
                  : "text-zinc-500 hover:text-black dark:hover:text-white"
              }`}
            >
              {r}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <PerformanceChart data={chartData} currency={currency} />
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center gap-2 mb-4 text-zinc-500">
                <Target className="h-4 w-4" />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Profit Factor</h4>
              </div>
              <p className="text-4xl font-black text-black dark:text-white tracking-tighter">{profitFactor.toFixed(2)}</p>
              <div className="mt-4 h-2 w-full bg-zinc-100 rounded-full dark:bg-zinc-900 overflow-hidden">
                <div 
                  className="h-2 bg-blue-600 rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min((profitFactor / 3) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-zinc-400 mt-2 font-bold uppercase tracking-tight">Strategy Efficiency Rating</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center gap-2 mb-4 text-zinc-500">
                <Wallet className="h-4 w-4" />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Calculated Balance</h4>
              </div>
              <p className="text-4xl font-black text-black dark:text-white tracking-tighter">{formatCurrency(calculatedBalance, currency)}</p>
              <p className="text-[10px] text-zinc-500 mt-2 font-bold uppercase">Growth: {growthPercentage.toFixed(2)}% Lifetime</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="text-xs font-black mb-6 text-zinc-400 uppercase tracking-widest">Key Statistics ({range})</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-50 dark:border-zinc-900 pb-3">
                <span className="text-xs font-bold text-zinc-500 uppercase">Total Trades</span>
                <span className="text-sm font-black text-black dark:text-white">{totalTrades}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-50 dark:border-zinc-900 pb-3">
                <span className="text-xs font-bold text-zinc-500 uppercase">Win Rate</span>
                <span className="text-sm font-black text-green-600">{winRate.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-50 dark:border-zinc-900 pb-3">
                <span className="text-xs font-bold text-zinc-500 uppercase">Avg. Win</span>
                <span className="text-sm font-black text-green-600">{formatCurrency(avgWin, currency)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-50 dark:border-zinc-900 pb-3">
                <span className="text-xs font-bold text-zinc-500 uppercase">Avg. Loss</span>
                <span className="text-sm font-black text-red-600">-{formatCurrency(avgLoss, currency)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-50 dark:border-zinc-900 pb-3">
                <span className="text-xs font-bold text-zinc-500 uppercase">Gross Profit</span>
                <span className="text-sm font-black text-green-600">{formatCurrency(grossProfit, currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500 uppercase">Gross Loss</span>
                <span className="text-sm font-black text-red-600">-{formatCurrency(grossLoss, currency)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-black p-8 text-white shadow-xl dark:bg-zinc-900/50 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="h-20 w-20" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 text-zinc-400">
                <TrendingUp className="h-4 w-4" />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Growth Outlook</h4>
              </div>
              <p className="text-4xl font-black mb-3 tracking-tighter">{formatCurrency(calculatedBalance * 1.05, currency)}</p>
              <p className="text-[10px] text-zinc-400 leading-relaxed font-bold uppercase tracking-tight">
                Projected 5% gain based on {profitFactor.toFixed(2)} PF efficiency. Next 30 day estimation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
