import { auth } from "@/auth";
import { User, CreditCard, LogOut, ChevronRight, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/layout/logout-button";
import { cn } from "@/lib/utils";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const menuItems = [
    {
      title: "My Profile",
      desc: "Manage your personal information, name, and email address.",
      href: "/dashboard/profile",
      icon: User,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "My Account",
      desc: "Manage your trading accounts, API keys, and connection settings.",
      href: "/dashboard/account",
      icon: CreditCard,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-900/20"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-black dark:text-white">Settings Hub</h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">Choose a category to manage your TradeAI preferences.</p>
      </div>

      <div className="grid gap-4">
        {menuItems.map((item) => (
          <Link 
            key={item.href}
            href={item.href}
            className="group relative flex items-center justify-between p-6 rounded-3xl border border-zinc-100 bg-white shadow-sm hover:border-blue-200 hover:shadow-md transition-all dark:border-zinc-900 dark:bg-zinc-950 dark:hover:border-blue-900"
          >
            <div className="flex items-center gap-6">
              <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", item.bg)}>
                <item.icon className={cn("h-8 w-8", item.color)} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black uppercase tracking-tight text-black dark:text-white">{item.title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">{item.desc}</p>
              </div>
            </div>
            <ChevronRight className="h-6 w-6 text-zinc-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </Link>
        ))}

        <LogoutButton className="w-full" />
      </div>

      <div className="rounded-3xl bg-zinc-900 p-8 dark:bg-zinc-900/50 relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 text-blue-400 font-black uppercase tracking-widest text-[10px]">
            <SettingsIcon className="h-3 w-3" />
            System Preferences
          </div>
          <h4 className="text-xl font-bold text-white tracking-tight">Need help with your account?</h4>
          <p className="text-zinc-400 text-sm max-w-md">Our support team is available 24/7 to help you with any technical issues or account configurations.</p>
          <button className="rounded-xl bg-white px-6 py-2.5 text-xs font-black uppercase tracking-widest text-black hover:bg-zinc-200 transition-all">
            Contact Support
          </button>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
