import { auth } from "@/auth";
import { getNotifications, markAllAsRead } from "@/app/actions/notifications";
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const notifications = await getNotifications();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">Notifications</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Stay updated with your trading and AI insights.</p>
        </div>
        <form action={markAllAsRead}>
          <button className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline">
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border-2 border-dashed border-zinc-100 dark:border-zinc-900">
            <div className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-full mb-4">
              <Bell className="h-10 w-10 text-zinc-300" />
            </div>
            <p className="text-zinc-500">No notifications yet.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={cn(
                "group relative flex gap-4 rounded-2xl border p-6 transition-all",
                notif.isRead 
                  ? "border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950" 
                  : "border-blue-100 bg-blue-50/30 dark:border-blue-900/20 dark:bg-blue-900/10"
              )}
            >
              <div className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center shrink-0",
                notif.type === 'success' ? "bg-green-100 text-green-600 dark:bg-green-900/20" :
                notif.type === 'warning' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20" :
                notif.type === 'error' ? "bg-red-100 text-red-600 dark:bg-red-900/20" :
                "bg-blue-100 text-blue-600 dark:bg-blue-900/20"
              )}>
                {notif.type === 'success' ? <CheckCircle2 className="h-6 w-6" /> :
                 notif.type === 'warning' ? <AlertTriangle className="h-6 w-6" /> :
                 notif.type === 'error' ? <XCircle className="h-6 w-6" /> :
                 <Info className="h-6 w-6" />}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-black dark:text-white">{notif.title}</h3>
                  <span className="text-xs text-zinc-400">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {notif.message}
                </p>
              </div>
              {!notif.isRead && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-600"></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
