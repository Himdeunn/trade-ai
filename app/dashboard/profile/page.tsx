import { auth } from "@/auth";
import { db } from "@/lib/db";
import { User, Shield, Lock, Bell, Mail, Camera } from "lucide-react";
import { NotificationSettings } from "@/components/trading/notification-settings";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await db.query.users.findFirst({
    where: (table, { eq }) => eq(table.id, session.user.id as string),
  });

  if (!user) return null;

  const initialSettings = {
    notifyDaily: user.notifyDaily || 0,
    notifyAi: user.notifyAi || 0,
    notifyTrades: user.notifyTrades || 0,
    notifyWeekly: user.notifyWeekly || 0,
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-12">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-black dark:text-white">My Profile</h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">Manage your personal identity and account security.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Avatar & Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl border border-zinc-100 bg-white p-8 shadow-sm dark:border-zinc-900 dark:bg-zinc-950 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-24 bg-blue-600/10" />
            <div className="relative z-10">
              <div className="relative mx-auto h-32 w-32 mb-6 group cursor-pointer">
                <div className="h-full w-full rounded-3xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border-4 border-white dark:border-zinc-950 shadow-xl overflow-hidden">
                  <User className="h-16 w-16 text-zinc-300" />
                </div>
                <div className="absolute inset-0 rounded-3xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white">{user.name || "Trader"}</h3>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">Premium Member</p>
              
              <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-900 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-lg font-black text-black dark:text-white">124</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Trades</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-black dark:text-white">68%</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Win Rate</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-100 bg-zinc-900 p-6 text-white shadow-xl dark:bg-zinc-900/50">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-5 w-5 text-blue-400" />
              <h4 className="font-bold tracking-tight uppercase text-xs tracking-widest">Account Security</h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">Your account is protected by industry-standard encryption and secure authentication.</p>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full w-full bg-blue-500" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mt-2">Status: Fully Secured</p>
          </div>
        </div>

        {/* Right Column - Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* General Information */}
          <section className="p-8 rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
            <div className="flex items-center gap-2 mb-8 border-b border-zinc-50 pb-4 dark:border-zinc-900">
              <Mail className="h-5 w-5 text-blue-600" />
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">General Information</h2>
            </div>
            <form className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Display Name</label>
                  <input 
                    type="text" 
                    defaultValue={user.name || ""} 
                    className="w-full rounded-2xl border border-zinc-100 bg-zinc-50/50 px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none dark:border-zinc-900 dark:bg-zinc-900/50 dark:text-white transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    type="email" 
                    defaultValue={user.email || ""} 
                    readOnly
                    className="w-full rounded-2xl border border-zinc-100 bg-zinc-100 px-4 py-3.5 text-sm font-bold text-zinc-500 outline-none dark:border-zinc-900 dark:bg-zinc-900/30" 
                  />
                </div>
              </div>
              <button className="rounded-xl bg-blue-600 px-8 py-3.5 text-xs font-black uppercase tracking-widest text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                Update Profile
              </button>
            </form>
          </section>

          {/* Security */}
          <section className="p-8 rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
            <div className="flex items-center gap-2 mb-8 border-b border-zinc-50 pb-4 dark:border-zinc-900">
              <Lock className="h-5 w-5 text-blue-600" />
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">Password & Security</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-black dark:text-white uppercase tracking-tight">Security Password</p>
                <p className="text-xs text-zinc-500 font-medium">Changed 3 months ago</p>
              </div>
              <button className="rounded-xl border border-zinc-200 px-6 py-2.5 text-xs font-black uppercase tracking-widest dark:border-zinc-800 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all">
                Update Security
              </button>
            </div>
          </section>

          {/* Notifications */}
          <section className="p-8 rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
            <div className="flex items-center gap-2 mb-8 border-b border-zinc-50 pb-4 dark:border-zinc-900">
              <Bell className="h-5 w-5 text-blue-600" />
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">Notification Preferences</h2>
            </div>
            <NotificationSettings initialSettings={initialSettings} />
          </section>
        </div>
      </div>
    </div>
  );
}
