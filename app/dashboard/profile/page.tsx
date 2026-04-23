import { auth } from "@/auth";
import { db } from "@/lib/db";
import { FileText, ExternalLink } from "lucide-react";
import { ProfileFormClient } from "@/components/trading/profile-form-client";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-black dark:text-white">My Profile</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Manage your personal identity and account security.</p>
        </div>
        <div className="flex gap-2">
          <button suppressHydrationWarning className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 transition-all">
            <FileText className="h-4 w-4" />
            Terms
          </button>
          <button suppressHydrationWarning className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 transition-all">
            <ExternalLink className="h-4 w-4" />
            Privacy
          </button>
        </div>
      </div>

      <ProfileFormClient user={user} initialSettings={initialSettings} />
    </div>
  );
}
