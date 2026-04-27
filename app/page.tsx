"use client";

import Link from "next/link";
import { TrendingUp, BrainCircuit, Cloud, ShieldCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black selection:bg-blue-600/20">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 backdrop-blur-xl bg-white/70 dark:bg-black/70 border-b border-zinc-100 dark:border-zinc-900">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 font-black tracking-tighter text-xl"
        >
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <span className="uppercase text-sm tracking-widest">TradeAI</span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-8"
        >
          <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-blue-600 transition-colors">Login</Link>
          <Link href="/signup" className="button-premium button-primary py-3 px-6">
            Get Started
          </Link>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <header className="relative flex flex-col items-center justify-center px-8 pt-48 pb-32 text-center max-w-5xl mx-auto overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 mb-8"
        >
          <SparkleIcon className="h-3 w-3 text-blue-600" />
          Powered by Gemini AI 1.5 Flash
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-6xl font-black uppercase leading-[0.9] tracking-tighter text-black dark:text-white sm:text-8xl mb-10"
        >
          Master Your <br />
          <span className="text-blue-600">Trading Psychology</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-2xl text-lg font-medium leading-relaxed text-zinc-500 dark:text-zinc-400 mb-14"
        >
          Automatic journaling, performance analytics, and psychological insights for MetaTrader traders. No EAs, no VPS, just pure cloud intelligence.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-6"
        >
          <Link href="/signup" className="button-premium button-primary flex items-center gap-3 py-5 px-10 text-xs">
            Start Free Trial <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/login" className="button-premium button-secondary py-5 px-10 text-xs">
            View Live Demo
          </Link>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 blur-[120px] rounded-full" />
        </div>
      </header>

      {/* Features Grid */}
      <section className="px-8 py-32 border-y border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/20">
        <div className="max-w-6xl mx-auto grid gap-12 md:grid-cols-3">
          <FeatureCard 
            icon={Cloud}
            index={0}
            title="Cloud Sync"
            description="Direct integration with MetaTrader servers via MetaApi. Your data syncs 24/7 without needing your terminal open."
          />
          <FeatureCard 
            icon={BrainCircuit}
            index={1}
            title="AI Analysis"
            description="Gemini AI analyzes your trading patterns to detect revenge trading, FOMO, and emotional biases before they cost you."
          />
          <FeatureCard 
            icon={ShieldCheck}
            index={2}
            title="Secure Data"
            description="Your investor passwords are encrypted with AES-256. We never have access to your funds or trading permissions."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-100 px-8 py-20 dark:border-zinc-900">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
          <div className="flex items-center gap-2 font-black tracking-tighter text-lg uppercase">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <span className="text-sm tracking-widest">TradeAI</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">© 2026 TradeAnalysis AI. All rights reserved.</p>
          <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-600 transition-colors">API Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, index }: { icon: any, title: string, description: string, index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group rounded-[32px] border border-zinc-100 bg-white p-10 transition-all hover:shadow-2xl hover:shadow-blue-600/5 hover:-translate-y-2 dark:border-zinc-900 dark:bg-zinc-950"
    >
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-zinc-900">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mb-4 text-xs font-black uppercase tracking-widest">{title}</h3>
      <p className="text-sm font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
    </motion.div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SparkleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.937A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
      <path d="M4 17v2" />
      <path d="M5 18H3" />
    </svg>
  )
}
