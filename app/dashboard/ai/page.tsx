import { auth } from "@/auth";
import { db } from "@/lib/db";
import { aiAnalyses } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { BrainCircuit, MessageSquare, Sparkles, Wand2 } from "lucide-react";
import { GenerateButton } from "./generate-button";

export default async function AIPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session!.user!.id as string;
  const account = await db.query.tradingAccounts.findFirst({
    where: (table, { eq }) => eq(table.userId, userId),
  });

  const analyses = account 
    ? await db.query.aiAnalyses.findMany({
        where: (table, { eq }) => eq(table.accountId, account.id),
        orderBy: [desc(aiAnalyses.createdAt)],
      })
    : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Trading Analysis</h1>
          <p className="text-zinc-500">Advanced insights and psychological analysis of your trading patterns.</p>
        </div>
        <GenerateButton />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-3xl border border-blue-100 bg-blue-50/30 p-8 dark:border-blue-900/20 dark:bg-blue-900/10">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="mb-2 text-xl font-bold">Strategy Optimization</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Our AI analyzes your win rate across different symbols to suggest the best pairs for your style.</p>
        </div>

        <div className="rounded-3xl border border-purple-100 bg-purple-50/30 p-8 dark:border-purple-900/20 dark:bg-purple-900/10">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-500/20">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <h3 className="mb-2 text-xl font-bold">Psychology Check</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Detect signs of revenge trading or over-leveraging based on your trade frequency and timing.</p>
        </div>

        <div className="rounded-3xl border border-zinc-100 bg-zinc-50/30 p-8 dark:border-zinc-800 dark:bg-zinc-900/10">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-white shadow-lg shadow-zinc-500/20">
            <Wand2 className="h-6 w-6" />
          </div>
          <h3 className="mb-2 text-xl font-bold">Custom Queries</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Ask specific questions about your trades and get tailored AI feedback immediately.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-3 mb-8">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h3 className="text-xl font-bold">Analysis History</h3>
        </div>
        
        <div className="space-y-12">
          {analyses.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-zinc-500">No AI analysis reports yet. Click &quot;Generate New Analysis&quot; to start.</p>
            </div>
          ) : (
            analyses.map((analysis) => (
              <div key={analysis.id} className="relative pl-8 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-[2px] before:bg-zinc-100 dark:before:bg-zinc-900">
                <div className="absolute left-[-5px] top-2 h-[12px] w-[12px] rounded-full bg-blue-500 ring-4 ring-white dark:ring-zinc-950"></div>
                <div className="mb-4">
                  <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
                    {analysis.category || 'General Analysis'} • {analysis.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <div className="prose prose-zinc dark:prose-invert max-w-none">
                  {analysis.content.split('\n').map((line, i) => (
                    <p key={i} className="text-lg leading-relaxed text-zinc-800 dark:text-zinc-200">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
