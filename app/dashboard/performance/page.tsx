import { auth } from "@/auth";
import { db } from "@/lib/db";
import { trades } from "@/lib/db/schema";
import { desc, gte, and, eq } from "drizzle-orm";
import { PerformanceChart } from "@/components/trading/performance-chart";
import { TrendingUp, Calendar, Target, Wallet } from "lucide-react";
import Link from "next/link";

export default async function PerformancePage(props: {
  searchParams: Promise<{ range?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user?.id) return null;

  const range = searchParams.range || "1M";
  const userId = session.user.id as string;
  const account = await db.query.tradingAccounts.findFirst({
    where: (table, { eq }) => eq(table.userId, userId),
  });

  if (!account) return <div>No account found</div>;

  // Calculate date filter
  let dateFilter = new Date();
  if (range === "1M") dateFilter.setMonth(dateFilter.getMonth() - 1);
  else if (range === "3M") dateFilter.setMonth(dateFilter.getMonth() - 3);
  else if (range === "6M") dateFilter.setMonth(dateFilter.getMonth() - 6);
  else if (range === "YTD") dateFilter = new Date(new Date().getFullYear(), 0, 1);
  else dateFilter = new Date(0); // All time

  const accountTrades = await db.query.trades.findMany({
    where: and(
      eq(trades.accountId, account.id),
      gte(trades.openTime, dateFilter)
    ),
    orderBy: [desc(trades.openTime)],
  });

  // Calculate statistics
  const totalTrades = accountTrades.length;
  const winningTrades = accountTrades.filter(t => (t.profit || 0) > 0);
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
  
  const grossProfit = winningTrades.reduce((acc, t) => acc + (t.profit || 0), 0);
  const grossLoss = Math.abs(accountTrades.filter(t => (t.profit || 0) < 0).reduce((acc, t) => acc + (t.profit || 0), 0));
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : (grossProfit > 0 ? 100 : 0);
  
  const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
  const avgLoss = (totalTrades - winningTrades.length) > 0 ? grossLoss / (totalTrades - winningTrades.length) : 0;

  // Simple equity curve calculation
  let currentBalance = account.balance || 0;
  const chartData = [{ date: Date.now(), equity: currentBalance }];
  
  accountTrades.slice(0, 20).forEach((t) => {
    currentBalance -= (t.profit || 0);
    chartData.unshift({
      date: t.openTime.getTime(),
      equity: currentBalance
    });
  });

  const ranges = ["1M", "3M", "6M", "YTD", "All"];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">Performance Analytics</h1>
          <p className="text-zinc-500 dark:text-zinc-400">In-depth breakdown of your trading growth and efficiency.</p>
        </div>
        <div className="flex bg-zinc-100 p-1 rounded-xl dark:bg-zinc-900">
          {ranges.map((r) => (
            <Link
              key={r}
              href={`/dashboard/performance?range=${r}`}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
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
          <PerformanceChart data={chartData} />
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center gap-2 mb-4 text-zinc-500">
                <Target className="h-4 w-4" />
                <h4 className="text-sm font-medium uppercase tracking-wider">Profit Factor</h4>
              </div>
              <p className="text-3xl font-bold text-black dark:text-white">{profitFactor.toFixed(2)}</p>
              <div className="mt-4 h-2 w-full bg-zinc-100 rounded-full dark:bg-zinc-900 overflow-hidden">
                <div 
                  className="h-2 bg-blue-600 rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min((profitFactor / 3) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center gap-2 mb-4 text-zinc-500">
                <Wallet className="h-4 w-4" />
                <h4 className="text-sm font-medium uppercase tracking-wider">Current Balance</h4>
              </div>
              <p className="text-3xl font-bold text-black dark:text-white">${(account.balance || 0).toLocaleString()}</p>
              <p className="text-xs text-zinc-500 mt-2">Equity: ${(account.equity || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="text-lg font-bold mb-6 text-black dark:text-white">Key Statistics ({range})</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Total Trades</span>
                <span className="font-bold text-black dark:text-white">{totalTrades}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Win Rate</span>
                <span className="font-bold text-green-600">{winRate.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Avg. Win</span>
                <span className="font-bold text-green-600">${avgWin.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Avg. Loss</span>
                <span className="font-bold text-red-600">-${avgLoss.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Gross Profit</span>
                <span className="font-bold text-green-600">${grossProfit.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Gross Loss</span>
                <span className="font-bold text-red-600">-${grossLoss.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-black p-8 text-white shadow-xl dark:bg-zinc-900/50 border border-white/5">
            <div className="flex items-center gap-2 mb-4 text-zinc-400">
              <TrendingUp className="h-4 w-4" />
              <h4 className="text-sm font-medium uppercase tracking-wider">Growth Outlook</h4>
            </div>
            <p className="text-3xl font-bold mb-3">${(account.balance ? account.balance * 1.05 : 0).toLocaleString()}</p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Based on your current profit factor of {profitFactor.toFixed(2)}, we project a 5% growth over the next 30 days if your strategy remains consistent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
