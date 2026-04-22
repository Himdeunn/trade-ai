import { auth } from "@/auth";
import { db } from "@/lib/db";
import { trades, tradingAccounts } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { cn } from "@/lib/utils";
import { Filter } from "lucide-react";
import { ImportCSVButton } from "@/components/trading/import-csv-button";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id as string;

  const accounts = await db.query.tradingAccounts.findMany({
    where: (table, { eq }) => eq(table.userId, userId),
  });

  const account = accounts[0];

  const allTrades = account
    ? await db.query.trades.findMany({
        where: (table, { eq }) => eq(table.accountId, account.id),
        orderBy: [desc(trades.openTime)],
      })
    : [];

  const accountsForImport = accounts.map((a) => ({
    id: a.id,
    broker: a.broker,
    accountNumber: a.accountNumber,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">Trade History</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            {allTrades.length} trades found. Import your MT4/MT5 history to get started.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900 transition-all shadow-sm">
            <Filter className="h-4 w-4" /> Filter
          </button>
          {accountsForImport.length > 0 && (
            <ImportCSVButton accounts={accountsForImport} />
          )}
        </div>
      </div>

      {allTrades.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-3xl border-2 border-dashed border-zinc-100 dark:border-zinc-900">
          <div className="text-5xl mb-4">📂</div>
          <h3 className="text-lg font-bold text-black dark:text-white mb-2">No trade history yet</h3>
          <p className="text-zinc-500 text-sm max-w-sm">
            Import your MetaTrader CSV file or connect your EA Bridge to start syncing trades automatically.
          </p>
        </div>
      ) : (
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
                  <td className="px-6 py-4 font-bold text-black dark:text-white">{trade.symbol}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold",
                      trade.type === "buy"
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                        : "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
                    )}>
                      {trade.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{trade.volume}</td>
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{trade.openPrice.toFixed(5)}</td>
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{trade.closePrice?.toFixed(5) || "—"}</td>
                  <td className={cn(
                    "px-6 py-4 font-bold",
                    (trade.profit || 0) > 0 ? "text-green-600" : (trade.profit || 0) < 0 ? "text-red-500" : "text-zinc-400"
                  )}>
                    {(trade.profit || 0) > 0 ? "+" : ""}{trade.profit?.toFixed(2) || "0.00"}
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-xs">
                    {trade.openTime.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
