"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { trades, aiAnalyses } from "@/lib/db/schema";
import { analyzeTradingPerformance } from "@/lib/ai-service";
import { desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function generateAIAnalysis(targetAccountId?: string) {
  let account;
  
  if (targetAccountId) {
    account = await db.query.tradingAccounts.findFirst({
      where: (table, { eq }) => eq(table.id, targetAccountId),
    });
  } else {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const userId = session.user.id as string;
    
    account = await db.query.tradingAccounts.findFirst({
      where: (table, { eq }) => eq(table.userId, userId),
    });
  }

  if (!account) throw new Error("No trading account linked");

  // 2. Fetch last 50 trades
  const recentTrades = await db.query.trades.findMany({
    where: (table, { eq }) => eq(table.accountId, account.id),
    orderBy: [desc(trades.openTime)],
    limit: 50,
  });

  if (recentTrades.length === 0) {
    throw new Error("No trades found to analyze");
  }

  // 3. Call Gemini
  const analysisContent = await analyzeTradingPerformance(recentTrades);

  // 4. Save to DB
  await db.insert(aiAnalyses).values({
    accountId: account.id,
    content: analysisContent,
    category: 'Trade Review',
  });

  revalidatePath("/dashboard/ai");
  return { success: true };
}
