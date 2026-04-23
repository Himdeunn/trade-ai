import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tradingAccounts, users } from "@/lib/db/schema";
import { User, Lock, Bell, Database, ExternalLink, Trash2, Plus } from "lucide-react";
import { eq } from "drizzle-orm";
import { AddAccountDialog } from "@/components/trading/add-account-dialog";
import { deleteTradingAccount } from "@/app/actions/trading";
import { CopyButton } from "@/components/ui/copy-button";
import { NotificationSettings } from "@/components/trading/notification-settings";
import { CurrencySelector } from "@/components/trading/currency-selector";
import { ClearHistoryButton } from "@/components/trading/clear-history-button";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id as string;
  const accounts = await db.query.tradingAccounts.findMany({
    where: (table, { eq }) => eq(table.userId, userId),
  });

  const user = await db.query.users.findFirst({
    where: (table, { eq }) => eq(table.id, userId),
  });

  if (!user) return null;

  const initialSettings = {
    notifyDaily: user.notifyDaily || 0,
    notifyAi: user.notifyAi || 0,
    notifyTrades: user.notifyTrades || 0,
    notifyWeekly: user.notifyWeekly || 0,
  };

  return (
    <div className="max-w-4xl space-y-10 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">Settings</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Manage your account preferences and trading connections.</p>
      </div>

      <div className="space-y-12">
        {/* Profile Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-lg font-bold border-b border-zinc-100 pb-3 dark:border-zinc-900">
            <User className="h-5 w-5 text-blue-600" />
            <h2 className="text-black dark:text-white">Profile Information</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Full Name</label>
              <input 
                type="text" 
                defaultValue={session.user?.name || ""} 
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                defaultValue={session.user?.email || ""} 
                readOnly
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50" 
              />
            </div>
          </div>
          <button className="rounded-xl bg-black px-8 py-3 text-sm font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all">
            Save Changes
          </button>
        </section>

        {/* Trading Accounts Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-900">
            <div className="flex items-center gap-2 text-lg font-bold">
              <Database className="h-5 w-5 text-blue-600" />
              <h2 className="text-black dark:text-white">Trading Accounts</h2>
            </div>
            <AddAccountDialog />
          </div>
          
          <div className="space-y-4">
            {accounts.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-zinc-100 p-12 text-center dark:border-zinc-900">
                <p className="text-zinc-500 mb-4">No accounts linked yet.</p>
              </div>
            ) : (
              accounts.map((account) => (
                <div key={account.id} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                        <ExternalLink className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-black dark:text-white">{account.broker || "MetaTrader Account"}</p>
                        <p className="text-sm text-zinc-500">
                          {account.platform.toUpperCase()} • Account: {account.accountNumber} • {account.server}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <code className="bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded text-[10px] text-zinc-600 dark:text-zinc-400 font-mono">
                            EA Key: {account.apiKey}
                          </code>
                          <CopyButton text={account.apiKey} />
                          <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1" />
                          <CurrencySelector accountId={account.id} currentCurrency={account.currency || "USD"} />
                          <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1" />
                          <ClearHistoryButton accountId={account.id} />
                        </div>
                      </div>
                    </div>
                    <form action={async () => {
                      "use server";
                      await deleteTradingAccount(account.id);
                    }}>
                      <button type="submit" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                        <Trash2 className="h-4 w-4" />
                        Disconnect
                      </button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Security Section */}
        <section className="space-y-6 pt-4">
          <div className="flex items-center gap-2 text-lg font-bold border-b border-zinc-100 pb-3 dark:border-zinc-900">
            <Lock className="h-5 w-5 text-blue-600" />
            <h2 className="text-black dark:text-white">Security</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-6 rounded-2xl border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 shadow-sm">
              <div>
                <p className="font-bold text-black dark:text-white">Password</p>
                <p className="text-sm text-zinc-500">Update your account password</p>
              </div>
              <button className="rounded-xl border border-zinc-200 px-6 py-2.5 text-sm font-bold dark:border-zinc-800 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900">
                Change
              </button>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="space-y-6 pt-4">
          <div className="flex items-center gap-2 text-lg font-bold border-b border-zinc-100 pb-3 dark:border-zinc-900">
            <Bell className="h-5 w-5 text-blue-600" />
            <h2 className="text-black dark:text-white">Notifications</h2>
          </div>
          <NotificationSettings initialSettings={initialSettings} />
        </section>
      </div>
    </div>
  );
}
