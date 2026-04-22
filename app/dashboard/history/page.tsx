import { auth } from "@/auth";
import { db } from "@/lib/db";
import { trades } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { cn } from "@/lib/utils";
import { Filter, Download } from "lucide-react";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id as string;
  const account = await db.query.tradingAccounts.findFirst({
    where: (table, { eq }) => eq(table.userId, userId),
  });

  if (!account) return <div>No account found</div>;

  const allTrades = await db.query.trades.findMany({
    where: (table, { eq }) => eq(table.accountId, account.id),
    orderBy: [desc(trades.openTime)],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trade History</h1>
          <p className="text-zinc-500">View and filter your past trading performance.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900">
            <Filter className="h-4 w-4" /> Filter
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900/50">
            <tr>
              <th className="px-6 py-4 font-medium">Symbol</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Volume</th>
              <th className="px-6 py-4 font-medium">Open Price</th>
              <th className="px-6 py-4 font-medium">Close Price</th>
              <th className="px-6 py-4 font-medium">Profit</th>
              <th className="px-6 py-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {allTrades.map((trade) => (
              <tr key={trade.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                <td className="px-6 py-4 font-bold">{trade.symbol}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    trade.type === 'buy' ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                  )}>
                    {trade.type.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">{trade.volume}</td>
                <td className="px-6 py-4">{trade.openPrice.toFixed(5)}</td>
                <td className="px-6 py-4">{trade.closePrice?.toFixed(5) || "-"}</td>
                <td className={cn(
                  "px-6 py-4 font-bold",
                  (trade.profit || 0) > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {(trade.profit || 0) > 0 ? "+" : ""}{trade.profit?.toFixed(2) || "0.00"}
                </td>
                <td className="px-6 py-4 text-zinc-500">
                  {trade.openTime.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
