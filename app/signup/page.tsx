"use client";

import { useState } from "react";
import { signup } from "@/app/actions/auth";
import { TrendingUp, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await signup(formData);

    if (result.success) {
      router.push("/login?message=Account created successfully");
    } else {
      setError(result.error || "Failed to create account");
      setIsPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl bg-white p-10 shadow-2xl dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
            <TrendingUp className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">Join TradeAI</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Start analyzing your trades like a pro</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">Full Name</label>
            <input 
              name="name"
              type="text" 
              required
              placeholder="John Doe"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-900" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">Email Address</label>
            <input 
              name="email"
              type="email" 
              required
              placeholder="name@company.com"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-900" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">Password</label>
            <input 
              name="password"
              type="password" 
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-900" 
            />
          </div>
          
          {error && (
            <p className="text-sm font-medium text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">{error}</p>
          )}

          <button 
            type="submit"
            disabled={isPending}
            className="w-full mt-6 button-premium button-primary flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              <>
                Create Account <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-zinc-100 pt-8 dark:border-zinc-900">
          <p className="text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-black dark:text-white hover:underline">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
