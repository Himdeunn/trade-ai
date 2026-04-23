"use client";

import { useState } from "react";
import { Mail, Phone, Lock, Bell, FileText, ExternalLink, Shield } from "lucide-react";
import { AvatarSelector } from "./avatar-selector";
import { SecurityProgress } from "./security-progress";
import { TwoFactorSetup } from "./two-factor-setup";
import { NotificationSettings } from "./notification-settings";

import { updateProfile } from "@/app/actions/user";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ProfileFormClient({ user, initialSettings }: { user: any, initialSettings: any }) {
  const [avatar, setAvatar] = useState(user.avatar || "avatar-1");
  const [isPending, setIsPending] = useState(false);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    formData.append("avatar", avatar);
    
    const result = await updateProfile(formData);
    if (result.success) {
      toast.success("Profile updated successfully");
    } else {
      toast.error(result.error || "Failed to update profile");
    }
    setIsPending(false);
  };

  // ... (rest of logic)

  // Calculate security score
  let securityScore = 30; // Base score for account creation
  const suggestions = [];
  
  if (user.twoFactorEnabled) securityScore += 40;
  else suggestions.push("Enable Two-Factor Authentication (2FA)");
  
  if (user.phoneNumber) securityScore += 15;
  else suggestions.push("Add a phone number for recovery");
  
  if (user.fullName) securityScore += 15;
  else suggestions.push("Complete your full profile name");

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Left Column - Avatar & Info */}
      <div className="lg:col-span-1 space-y-6">
        <div className="rounded-3xl border border-zinc-100 bg-white p-8 shadow-sm dark:border-zinc-900 dark:bg-zinc-950 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-24 bg-blue-600/10" />
          <div className="relative z-10">
            <AvatarSelector currentAvatar={avatar} onSelect={setAvatar} />
            <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white">{user.name || "Trader"}</h3>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full inline-block">
              {user.role === 'admin' ? 'Administrator' : 'Premium Member'}
            </p>
            
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

        <SecurityProgress score={securityScore} suggestions={suggestions} />
      </div>

      {/* Right Column - Forms */}
      <div className="lg:col-span-2 space-y-8">
        {/* General Information */}
        <section className="p-8 rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
          <div className="flex items-center gap-2 mb-8 border-b border-zinc-50 pb-4 dark:border-zinc-900">
            <Mail className="h-5 w-5 text-blue-600" />
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">General Information</h2>
          </div>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Username</label>
                <input 
                  name="name"
                  type="text" 
                  defaultValue={user.name || ""} 
                  suppressHydrationWarning
                  className="w-full rounded-2xl border border-zinc-100 bg-zinc-50/50 px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none dark:border-zinc-900 dark:bg-zinc-900/50 dark:text-white transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Full Name</label>
                <input 
                  name="fullName"
                  type="text" 
                  defaultValue={user.fullName || ""} 
                  placeholder="Enter your full name"
                  suppressHydrationWarning
                  className="w-full rounded-2xl border border-zinc-100 bg-zinc-50/50 px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none dark:border-zinc-900 dark:bg-zinc-900/50 dark:text-white transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input 
                    name="phoneNumber"
                    type="tel" 
                    defaultValue={user.phoneNumber || ""} 
                    placeholder="+62 812..."
                    suppressHydrationWarning
                    className="w-full rounded-2xl border border-zinc-100 bg-zinc-50/50 pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none dark:border-zinc-900 dark:bg-zinc-900/50 dark:text-white transition-all" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  type="email" 
                  defaultValue={user.email || ""} 
                  readOnly
                  suppressHydrationWarning
                  className="w-full rounded-2xl border border-zinc-100 bg-zinc-100 px-4 py-3.5 text-sm font-bold text-zinc-500 outline-none dark:border-zinc-900 dark:bg-zinc-900/30" 
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isPending}
              className="rounded-xl bg-blue-600 px-8 py-3.5 text-xs font-black uppercase tracking-widest text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Profile Details"}
            </button>
          </form>
        </section>

        {/* Security & 2FA */}
        <section className="p-8 rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
          <div className="flex items-center gap-2 mb-8 border-b border-zinc-50 pb-4 dark:border-zinc-900">
            <Lock className="h-5 w-5 text-blue-600" />
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">Account Security</h2>
          </div>
          
          <div className="space-y-6">
            <TwoFactorSetup 
              isEnabled={!!user.twoFactorEnabled} 
              email={user.email}
              initialSecret={user.twoFactorSecret}
            />

            <div className="flex items-center justify-between p-6 rounded-3xl border border-zinc-50 bg-zinc-50/30 dark:bg-zinc-900/20 dark:border-zinc-900">
              <div>
                <p className="font-bold text-black dark:text-white uppercase tracking-tight text-xs">Security Password</p>
                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest mt-1">Last changed 3 months ago</p>
              </div>
              <button className="rounded-xl border border-zinc-200 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest dark:border-zinc-800 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all">
                Change Password
              </button>
            </div>
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
  );
}
