import { auth } from "@/auth";
import { db } from "@/lib/db";
import { trades, tradingAccounts } from "@/lib/db/schema";
import { desc, eq, and, like, count } from "drizzle-orm";
import { cn } from "@/lib/utils";
import { Filter, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { ImportCSVButton } from "@/components/trading/import-csv-button";
import Link from "next/link";

export default async function HistoryPage(props: {
  searchParams: Promise<{ 
    page?: string; 
    symbol?: string; 
    type?: string;
    accountId?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id as string;
  const page = parseInt(searchParams.page || "1");
  const limit = 20;
  const offset = (page - 1) * limit;
  const symbolFilter = searchParams.symbol || "";
  const typeFilter = searchParams.type || "";

  const accounts = await db.query.tradingAccounts.findMany({
    where: (table, { eq }) => eq(table.userId, userId),
  });

  const selectedAccountId = searchParams.accountId || accounts[0]?.id;
  const account = accounts.find(a => a.id === selectedAccountId);

  // Build filters
  const filters = [];
  if (selectedAccountId) filters.push(eq(trades.accountId, selectedAccountId));
  if (symbolFilter) filters.push(like(trades.symbol, `%${symbolFilter}%`));
  if (typeFilter && (typeFilter === "buy" || typeFilter === "sell")) {
    filters.push(eq(trades.type, typeFilter));
  }

  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  // Fetch count for pagination
  const [totalResult] = await db
    .select({ total: count() })
    .from(trades)
    .where(whereClause);
  
  const totalTrades = totalResult.total;
  const totalPages = Math.ceil(totalTrades / limit);

  const allTrades = selectedAccountId
    ? await db.query.trades.findMany({
        where: whereClause,
        orderBy: [desc(trades.openTime)],
        limit,
        offset,
      })
    : [];

  const accountsForImport = accounts.map((a) => ({
    id: a.id,
    broker: a.broker,
    accountNumber: a.accountNumber,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">Trade History</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            {totalTrades} trades found across your accounts.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {accountsForImport.length > 0 && (
            <ImportCSVButton accounts={accountsForImport} />
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl bg-white border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <form className="w-full">
            <input 
              name="symbol"
              defaultValue={symbolFilter}
              placeholder="Search symbol (e.g. XAUUSD)..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-zinc-100 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {/* We need to preserve other params in the form if we were using traditional form submit, 
                but for simplicity we'll just use a button or let users press enter */}
            <input type="hidden" name="type" value={typeFilter} />
            <input type="hidden" name="accountId" value={selectedAccountId} />
          </form>
        </div>
        
        <div className="flex gap-3">
          <select 
            value={selectedAccountId}
            onChange={(e) => {
              const url = new URL(window.location.href);
              url.searchParams.set("accountId", e.target.value);
              url.searchParams.set("page", "1");
              window.location.href = url.toString();
            }}
            className="px-4 py-2 text-sm rounded-xl border border-zinc-100 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 outline-none"
            style={{ display: 'none' }} // This select needs client-side, using links for now
          />
          
          <div className="flex rounded-xl border border-zinc-100 bg-zinc-50 p-1 dark:bg-zinc-900 dark:border-zinc-800">
            <Link 
              href={`/dashboard/history?type=&symbol=${symbolFilter}&accountId=${selectedAccountId}`}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                !typeFilter ? "bg-white text-black shadow-sm dark:bg-zinc-800 dark:text-white" : "text-zinc-500"
              )}
            >
              All
            </Link>
            <Link 
              href={`/dashboard/history?type=buy&symbol=${symbolFilter}&accountId=${selectedAccountId}`}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                typeFilter === "buy" ? "bg-white text-blue-600 shadow-sm dark:bg-zinc-800" : "text-zinc-500"
              )}
            >
              Buy
            </Link>
            <Link 
              href={`/dashboard/history?type=sell&symbol=${symbolFilter}&accountId=${selectedAccountId}`}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                typeFilter === "sell" ? "bg-white text-rose-600 shadow-sm dark:bg-zinc-800" : "text-zinc-500"
              )}
            >
              Sell
            </Link>
          </div>
        </div>
      </div>

      {allTrades.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-3xl border-2 border-dashed border-zinc-100 dark:border-zinc-900 bg-white/50 dark:bg-zinc-950/50">
          <div className="text-5xl mb-4">📂</div>
          <h3 className="text-lg font-bold text-black dark:text-white mb-2">No matching trades</h3>
          <p className="text-zinc-500 text-sm max-w-sm">
            Try adjusting your filters or import your trading history.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-950 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-900">
                  <tr>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Symbol</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Type</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Volume</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Open Price</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Close Price</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Profit</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900">
                  {allTrades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{trade.symbol}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest",
                          trade.type === "buy"
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                            : "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
                        )}>
                          {trade.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 font-mono text-xs">{trade.volume.toFixed(2)}</td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 font-mono text-xs">{trade.openPrice.toFixed(5)}</td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 font-mono text-xs">{trade.closePrice?.toFixed(5) || "—"}</td>
                      <td className={cn(
                        "px-6 py-4 font-black font-mono",
                        (trade.profit || 0) > 0 ? "text-green-600" : (trade.profit || 0) < 0 ? "text-red-500" : "text-zinc-400"
                      )}>
                        {(trade.profit || 0) > 0 ? "+" : ""}{trade.profit?.toFixed(2) || "0.00"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-zinc-900 dark:text-zinc-300 font-medium whitespace-nowrap">
                          {trade.openTime.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {trade.openTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <p className="text-xs text-zinc-500">
                Showing <span className="font-bold text-zinc-900 dark:text-zinc-100">{offset + 1}</span> to <span className="font-bold text-zinc-900 dark:text-zinc-100">{Math.min(offset + limit, totalTrades)}</span> of <span className="font-bold text-zinc-900 dark:text-zinc-100">{totalTrades}</span> trades
              </p>
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/history?page=${page - 1}&symbol=${symbolFilter}&type=${typeFilter}&accountId=${selectedAccountId}`}
                  className={cn(
                    "p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-all",
                    page <= 1 ? "opacity-30 pointer-events-none" : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum = page;
                    if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;
                    
                    if (pageNum <= 0 || pageNum > totalPages) return null;

                    return (
                      <Link
                        key={pageNum}
                        href={`/dashboard/history?page=${pageNum}&symbol=${symbolFilter}&type=${typeFilter}&accountId=${selectedAccountId}`}
                        className={cn(
                          "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all",
                          page === pageNum 
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
                        )}
                      >
                        {pageNum}
                      </Link>
                    );
                  })}
                </div>
                <Link
                  href={`/dashboard/history?page=${page + 1}&symbol=${symbolFilter}&type=${typeFilter}&accountId=${selectedAccountId}`}
                  className={cn(
                    "p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-all",
                    page >= totalPages ? "opacity-30 pointer-events-none" : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
