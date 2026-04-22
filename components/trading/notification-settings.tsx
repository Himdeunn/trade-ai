"use client";

import { useState } from "react";
import { updateNotificationSettings } from "@/app/actions/notifications";
import { Loader2 } from "lucide-react";

interface SettingsProps {
  initialSettings: {
    notifyDaily: number;
    notifyAi: number;
    notifyTrades: number;
    notifyWeekly: number;
  };
}

export function NotificationSettings({ initialSettings }: SettingsProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [isPending, setIsPending] = useState(false);

  async function handleToggle(key: keyof typeof settings) {
    const newValue = settings[key] === 1 ? 0 : 1;
    const newSettings = { ...settings, [key]: newValue };
    
    setSettings(newSettings);
    setIsPending(true);
    try {
      await updateNotificationSettings(newSettings);
    } catch (error) {
      console.error(error);
      // Revert if error
      setSettings(settings);
    } finally {
      setIsPending(false);
    }
  }

  const prefs = [
    { key: "notifyDaily", label: "Daily trading summary" },
    { key: "notifyAi", label: "New AI analysis report" },
    { key: "notifyTrades", label: "Trade execution alerts" },
    { key: "notifyWeekly", label: "Weekly performance breakdown" },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {prefs.map((pref) => (
        <div key={pref.key} className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{pref.label}</span>
          <div className="relative">
            <input 
              type="checkbox" 
              checked={settings[pref.key] === 1}
              onChange={() => handleToggle(pref.key)}
              disabled={isPending}
              className="h-5 w-5 rounded-lg border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50" 
            />
            {isPending && (
              <div className="absolute -top-1 -right-1">
                <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
