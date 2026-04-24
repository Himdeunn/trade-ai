import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tradingAccounts } from "@/lib/db/schema";
import { Database, ExternalLink, Trash2, Plus, CreditCard, ShieldAlert } from "lucide-react";
import { eq } from "drizzle-orm";
import { AddAccountDialog } from "@/components/trading/add-account-dialog";
import { deleteTradingAccount } from "@/app/actions/trading";
import { CopyButton } from "@/components/ui/copy-button";
import { CurrencySelector } from "@/components/trading/currency-selector";
import { ClearHistoryButton } from "@/components/trading/clear-history-button";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session!.user!.id as string;
  const accounts = await db.query.tradingAccounts.findMany({
    where: (table, { eq }) => eq(table.userId, userId),
  });

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-black dark:text-white">My Accounts</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Manage your trading connections and account keys.</p>
        </div>
        <AddAccountDialog />
      </div>

      <div className="grid gap-6">
        {accounts.length === 0 ? (
          <div className="rounded-[40px] border-4 border-dashed border-zinc-100 p-20 text-center dark:border-zinc-900">
            <div className="h-20 w-20 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-6">
              <Database className="h-10 w-10 text-zinc-300" />
            </div>
            <h3 className="text-xl font-bold text-zinc-400 mb-2">No accounts connected</h3>
            <p className="text-sm text-zinc-500 mb-8 max-w-xs mx-auto">Link your first MetaTrader account to start tracking your performance with AI.</p>
            <AddAccountDialog />
          </div>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="group rounded-[32px] border border-zinc-100 bg-white p-8 shadow-sm dark:border-zinc-900 dark:bg-zinc-950 hover:shadow-xl transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 h-32 w-32 bg-blue-600/5 rounded-bl-[100px] -mr-10 -mt-10 group-hover:scale-125 transition-transform" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-start gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border-2 border-white dark:border-zinc-950 shadow-md shrink-0">
                    <ExternalLink className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white">{account.broker || "MetaTrader Account"}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-[10px] font-black text-green-600 uppercase tracking-widest dark:bg-green-900/20">Active</span>
                    </div>
                    <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest">
                      {account.platform.toUpperCase()} • {account.accountNumber} • {account.server}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-6">
                      <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">EA Key:</span>
                        <code className="text-xs font-black text-blue-600 font-mono tracking-tighter">
                          {account.apiKey.substring(0, 8)}...
                        </code>
                        <CopyButton text={account.apiKey} />
                      </div>
                      <CurrencySelector accountId={account.id} currentCurrency={account.currency || "USD"} />
                      <ClearHistoryButton accountId={account.id} />
                    </div>
                  </div>
                </div>

                <form action={async () => {
                  "use server";
                  await deleteTradingAccount(account.id);
                }}>
                  <button type="submit" className="flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-widest text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 transition-all">
                    <Trash2 className="h-4 w-4" />
                    Disconnect Account
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-8 rounded-[32px] bg-amber-50 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30 flex flex-col md:flex-row items-center gap-6">
        <div className="h-14 w-14 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
          <ShieldAlert className="h-8 w-8 text-amber-600" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h4 className="text-lg font-black uppercase tracking-tight text-amber-900 dark:text-amber-500">Security Warning</h4>
          <p className="text-sm text-amber-700/70 dark:text-amber-500/50 font-medium">Never share your API Keys or Investor Passwords with anyone. TradeAI employees will never ask for these credentials.</p>
        </div>
      </div>
    </div>
  );
}
