"use client";

import { Bell, Loader2, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: number;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications");
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => n.isRead === 0).length;

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: 1 } : n));
    } catch (err) {
      console.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Failed to mark all as read");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all",
          isOpen && "bg-zinc-100 dark:bg-zinc-900 text-blue-600"
        )}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white border-2 border-white dark:border-zinc-950 animate-in zoom-in">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 z-50 rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 p-4 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    disabled={isLoading}
                    className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                    <Bell className="h-8 w-8 text-zinc-200 mb-2" />
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-tighter">No notifications yet</p>
                    <p className="text-[10px] text-zinc-500 mt-1 uppercase">Stay tuned for trade alerts and AI analysis.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-50 dark:divide-zinc-900">
                    {notifications.map((n) => (
                      <div 
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={cn(
                          "p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer relative group",
                          n.isRead === 0 && "bg-blue-50/30 dark:bg-blue-900/10"
                        )}
                      >
                        {n.isRead === 0 && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                        )}
                        <p className={cn(
                          "text-xs font-black uppercase tracking-tight",
                          n.isRead === 0 ? "text-black dark:text-white" : "text-zinc-500"
                        )}>
                          {n.title}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{n.message}</p>
                        <p className="text-[9px] text-zinc-400 mt-2 font-mono uppercase tracking-widest">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Link 
                href="/dashboard/notifications" 
                onClick={() => setIsOpen(false)}
                className="block border-t border-zinc-100 p-3 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900 transition-colors"
              >
                View all notifications
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
