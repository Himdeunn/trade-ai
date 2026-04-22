import Link from "next/link";
import { TrendingUp, BrainCircuit, Cloud, ShieldCheck, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-zinc-100 dark:border-zinc-900">
        <div className="flex items-center gap-2 font-bold tracking-tighter text-xl">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <span>TradeAI</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium hover:text-blue-600">Login</Link>
          <Link href="/signup" className="rounded-full bg-black px-6 py-2 text-sm font-bold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-black">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="flex flex-col items-center justify-center px-8 pt-32 pb-20 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-xs font-bold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 mb-8">
          <SparkleIcon className="h-3 w-3 text-blue-600" />
          Powered by Gemini AI 1.5 Flash
        </div>
        <h1 className="text-6xl font-bold tracking-tight text-black dark:text-white sm:text-7xl mb-8">
          Master Your Trading <br />
          <span className="text-blue-600">With AI Intelligence</span>
        </h1>
        <p className="max-w-2xl text-xl leading-relaxed text-zinc-500 dark:text-zinc-400 mb-12">
          Automatic journaling, performance analytics, and psychological insights for MetaTrader traders. No EAs, no VPS, just pure cloud intelligence.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/signup" className="flex items-center gap-2 rounded-2xl bg-black px-8 py-4 text-lg font-bold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 shadow-xl shadow-black/10">
            Start Free Trial <ArrowRight className="h-5 w-5" />
          </Link>
          <button className="rounded-2xl border border-zinc-200 px-8 py-4 text-lg font-bold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950">
            View Live Demo
          </button>
        </div>
      </header>

      {/* Features Grid */}
      <section className="px-8 py-24 bg-zinc-50 dark:bg-zinc-950/50">
        <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-3">
          <FeatureCard 
            icon={Cloud}
            title="Cloud-to-Cloud Sync"
            description="Direct integration with MetaTrader servers via MetaApi. Your data syncs 24/7 without needing your terminal open."
          />
          <FeatureCard 
            icon={BrainCircuit}
            title="AI Psychology Check"
            description="Gemini AI analyzes your trading patterns to detect revenge trading, FOMO, and emotional biases before they cost you."
          />
          <FeatureCard 
            icon={ShieldCheck}
            title="Enterprise Security"
            description="Your investor passwords are encrypted with AES-256. We never have access to your funds or trading permissions."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-100 px-8 py-12 dark:border-zinc-900">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 font-bold tracking-tighter">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span>TradeAI</span>
          </div>
          <p className="text-sm text-zinc-500">© 2026 TradeAnalysis AI. All rights reserved.</p>
          <div className="flex gap-6 text-sm font-medium text-zinc-500">
            <a href="#" className="hover:text-black dark:hover:text-white">Privacy</a>
            <a href="#" className="hover:text-black dark:hover:text-white">Terms</a>
            <a href="#" className="hover:text-black dark:hover:text-white">API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-8 transition-all hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-3 text-xl font-bold">{title}</h3>
      <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">{description}</p>
    </div>
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
