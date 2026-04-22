import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tradingAccounts, trades } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateAIAnalysis } from "@/app/actions/ai";
import { createNotification } from "@/app/actions/notifications";

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await db.query.tradingAccounts.findFirst({
      where: (table, { eq }) => eq(table.apiKey, apiKey),
    });

    if (!account) {
      return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
    }

    const data = await req.json();

    // 1. Update Account Info (Balance, Equity)
    if (data.accountInfo) {
      await db.update(tradingAccounts)
        .set({
          balance: data.accountInfo.balance,
          equity: data.accountInfo.equity,
          currency: data.accountInfo.currency || "USD",
        })
        .where(eq(tradingAccounts.id, account.id));
    }

    // 2. Handle Trades
    if (data.trades && Array.isArray(data.trades)) {
      for (const tradeData of data.trades) {
        // Check if trade already exists
        const existingTrade = await db.query.trades.findFirst({
          where: (table, { and, eq }) => and(
            eq(table.accountId, account.id),
            eq(table.externalTradeId, tradeData.ticket.toString())
          ),
        });

        if (existingTrade) {
          // Update existing trade (e.g., if it closed)
          await db.update(trades)
            .set({
              closePrice: tradeData.closePrice,
              profit: tradeData.profit,
              commission: tradeData.commission,
              swap: tradeData.swap,
              closeTime: tradeData.closeTime ? new Date(tradeData.closeTime) : null,
            })
            .where(eq(trades.id, existingTrade.id));
            
          // If the trade was just closed, we could trigger AI analysis
          if (!existingTrade.closeTime && tradeData.closeTime) {
            // Trigger AI Analysis in background
            generateAIAnalysis(account.id).catch(console.error);

            // Create Notification
            await createNotification({
              userId: account.userId,
              title: "Trade Closed",
              message: `Your trade on ${tradeData.symbol} has been closed with a profit of $${tradeData.profit.toFixed(2)}.`,
              type: tradeData.profit >= 0 ? "success" : "warning",
            });
          }
        } else {
          // Insert new trade
          await db.insert(trades).values({
            accountId: account.id,
            externalTradeId: tradeData.ticket.toString(),
            symbol: tradeData.symbol,
            type: tradeData.type, // 'buy' or 'sell'
            volume: tradeData.volume,
            openPrice: tradeData.openPrice,
            closePrice: tradeData.closePrice,
            profit: tradeData.profit,
            commission: tradeData.commission,
            swap: tradeData.swap,
            openTime: new Date(tradeData.openTime),
            closeTime: tradeData.closeTime ? new Date(tradeData.closeTime) : null,
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
