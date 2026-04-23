"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Key, Smartphone, ChevronRight, Check, Copy, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function TwoFactorSetup({ isEnabled, email, initialSecret }: { isEnabled: boolean, email?: string, initialSecret?: string }) {
  const [step, setStep] = useState<'overview' | 'choice' | 'recovery' | 'authenticator'>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [secret] = useState(initialSecret || "JBSWY3DPEHPK3PXP"); // Example Base32 secret

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `otpauth://totp/TradeAI:${email || 'user'}?secret=${secret}&issuer=TradeAI`
  )}`;

  const recoveryWords = [
    "alpha", "bravo", "charlie", "delta", "echo", "foxtrot", 
    "golf", "hotel", "india", "juliet", "kilo", "lima"
  ];

  return (
    <div className="flex items-center justify-between p-6 rounded-3xl border border-zinc-100 bg-white dark:bg-zinc-950 dark:border-zinc-900 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={cn(
          "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
          isEnabled ? "bg-green-50 text-green-600 dark:bg-green-900/20" : "bg-zinc-50 text-zinc-400 dark:bg-zinc-900/50"
        )}>
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h4 className="font-black uppercase tracking-tight text-black dark:text-white">Two-Factor Authentication</h4>
          <p className="text-xs text-zinc-500 font-medium">Add an extra layer of security to your account.</p>
        </div>
      </div>
      
      <button 
        onClick={() => setIsModalOpen(true)}
        className={cn(
          "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
          isEnabled 
            ? "border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900" 
            : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20"
        )}
      >
        {isEnabled ? "Manage 2FA" : "Enable 2FA"}
      </button>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg rounded-[32px] bg-white p-8 shadow-2xl dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-hidden"
            >
              {step === 'overview' && (
                <div className="text-center">
                  <div className="mx-auto h-20 w-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-6 dark:bg-blue-900/20">
                    <Shield className="h-10 w-10" />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white mb-2">Secure Your Account</h2>
                  <p className="text-sm text-zinc-500 font-medium mb-8 max-w-sm mx-auto leading-relaxed">
                    Two-factor authentication adds a second step of verification when you sign in, making your account nearly impossible to breach.
                  </p>
                  <button 
                    onClick={() => setStep('choice')}
                    className="w-full bg-blue-600 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    Get Started <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {step === 'choice' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white mb-1">Choose Method</h2>
                    <p className="text-sm text-zinc-500 font-medium">Select how you want to verify your identity.</p>
                  </div>
                  
                  <div className="grid gap-4">
                    <button 
                      onClick={() => setStep('recovery')}
                      className="flex items-center justify-between p-6 rounded-2xl border-2 border-zinc-100 hover:border-blue-600 transition-all text-left dark:border-zinc-900 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                          <Key className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-black uppercase tracking-tight text-black dark:text-white">12-Word Phrase</p>
                          <p className="text-xs text-zinc-500">Traditional backup words for recovery.</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-zinc-300 group-hover:text-blue-600 transition-all" />
                    </button>

                    <button 
                      onClick={() => setStep('authenticator')}
                      className="flex items-center justify-between p-6 rounded-2xl border-2 border-zinc-100 hover:border-blue-600 transition-all text-left dark:border-zinc-900 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                          <Smartphone className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-black uppercase tracking-tight text-black dark:text-white">Authenticator App</p>
                          <p className="text-xs text-zinc-500">Google Authenticator, Authy, etc.</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-zinc-300 group-hover:text-blue-600 transition-all" />
                    </button>
                  </div>
                </div>
              )}

              {step === 'recovery' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                    <p className="text-[10px] font-bold text-amber-800 dark:text-amber-500 leading-normal uppercase">
                      Write these 12 words down and store them in a safe place. This is the ONLY way to recover your account if you lose access.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-zinc-50 dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                    {recoveryWords.map((word, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                        <span className="text-[8px] font-black text-zinc-300">{i + 1}</span>
                        <span className="text-xs font-bold text-black dark:text-white">{word}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(recoveryWords.join(" "));
                        toast.success("Phrase copied to clipboard");
                      }}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 py-4 text-xs font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
                    >
                      <Copy className="h-4 w-4" /> Copy
                    </button>
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 rounded-2xl bg-blue-600 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                    >
                      I Saved It
                    </button>
                  </div>
                </div>
              )}

              {step === 'authenticator' && (
                <div className="space-y-6 text-center">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white mb-1">Scan QR Code</h2>
                    <p className="text-sm text-zinc-500 font-medium">Scan this code in your authenticator app.</p>
                  </div>

                  <div className="mx-auto h-48 w-48 bg-zinc-100 dark:bg-zinc-900 rounded-3xl flex items-center justify-center border-4 border-white dark:border-zinc-950 shadow-xl overflow-hidden p-4">
                    <img src={qrCodeUrl} alt="2FA QR Code" className="h-full w-full" />
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <code className="text-xs font-black text-blue-600 font-mono tracking-tighter">{secret}</code>
                    <button onClick={() => {
                      navigator.clipboard.writeText(secret);
                      toast.success("Code copied");
                    }} className="text-zinc-400 hover:text-blue-600">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>

                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="w-full bg-blue-600 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl hover:bg-blue-700 transition-all"
                  >
                    Verify & Enable
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
