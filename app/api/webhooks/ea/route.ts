import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tradingAccounts, trades } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateAIAnalysis } from "@/app/actions/ai";
import { createNotification } from "@/app/actions/notifications";

// ─── Type untuk payload dari EA ───────────────────────────────────────────────
interface EATrade {
  positionId: number;       // Position ID dari MT5 (WAJIB — primary key deduplikasi)
  symbol: string;
  type: "buy" | "sell";
  volume: number;
  openPrice: number;
  closePrice: number | null;
  profit: number;
  commission: number;
  swap: number;
  openTime: string;
  closeTime: string | null;
  isClosed: boolean;        // true jika deal OUT sudah ada
}

interface EAPayload {
  accountInfo?: {
    balance: number;
    equity: number;
    currency: string;
    leverage: number;
    login: number;
    broker: string;
  };
  trades: EATrade[];
  openPositions?: unknown[];
  trigger: string;
}

// ─── POST Handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // 1. Auth — validasi API Key
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

    const data: EAPayload = await req.json();

    // 2. Update Account Info (balance, equity) jika ada
    if (data.accountInfo) {
      await db
        .update(tradingAccounts)
        .set({
          balance: data.accountInfo.balance,
          equity: data.accountInfo.equity,
          currency: data.accountInfo.currency ?? "USD",
        })
        .where(eq(tradingAccounts.id, account.id));
    }

    // 3. Validasi — pastikan array trades ada
    if (!Array.isArray(data.trades) || data.trades.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No trades to sync",
        synced: 0,
      });
    }

    // 4. Upsert setiap trade berdasarkan positionId (bukan deal ticket)
    let inserted = 0;
    let updated = 0;
    const closedTrades: EATrade[] = [];

    for (const trade of data.trades) {
      // Validasi field wajib per trade
      if (!trade.positionId || !trade.symbol || !trade.openTime) {
        console.warn("TradeAI Webhook: Skipping trade with missing fields", trade);
        continue;
      }

      const externalTradeId = trade.positionId.toString();

      // Cek apakah trade sudah ada di DB
      const existing = await db.query.trades.findFirst({
        where: (table, { and, eq }) =>
          and(
            eq(table.accountId, account.id),
            eq(table.externalTradeId, externalTradeId)
          ),
      });

      if (!existing) {
        // ── INSERT: Trade baru (belum ada di DB sama sekali) ──────────────
        await db.insert(trades).values({
          accountId:        account.id,
          externalTradeId:  externalTradeId,
          symbol:           trade.symbol,
          type:             trade.type,
          volume:           trade.volume,
          openPrice:        trade.openPrice,
          closePrice:       trade.isClosed ? trade.closePrice : null,
          profit:           trade.isClosed ? trade.profit : null,
          commission:       trade.commission,
          swap:             trade.swap,
          openTime:         new Date(trade.openTime),
          closeTime:        trade.isClosed && trade.closeTime
                              ? new Date(trade.closeTime)
                              : null,
        });
        inserted++;

        // Tandai sebagai closed trade yang baru masuk (untuk notifikasi)
        if (trade.isClosed) closedTrades.push(trade);

      } else {
        // ── UPDATE: Trade sudah ada — update data terbaru saja ────────────
        // Hanya update jika ada perubahan signifikan (misalnya trade baru saja close)
        const wasOpen   = existing.closeTime === null;
        const nowClosed = trade.isClosed;

        if (wasOpen && nowClosed) {
          // Trade baru saja ditutup → update data close
          await db
            .update(trades)
            .set({
              closePrice:  trade.closePrice,
              closeTime:   trade.closeTime ? new Date(trade.closeTime) : new Date(),
              profit:      trade.profit,
              commission:  trade.commission,
              swap:        trade.swap,
            })
            .where(eq(trades.id, existing.id));
          updated++;

          // Tandai sebagai newly closed untuk notifikasi
          closedTrades.push(trade);
        }
        // Jika sudah closed sebelumnya → skip (tidak ada yang perlu diubah)
      }
    }

    // 5. Notifikasi & AI Analysis untuk trade yang baru ditutup
    for (const closed of closedTrades) {
      // Buat notifikasi
      await createNotification({
        userId:  account.userId,
        title:   "Trade Closed",
        message: `Trade ${closed.type.toUpperCase()} ${closed.symbol} ditutup dengan P&L $${(closed.profit ?? 0).toFixed(2)}.`,
        type:    (closed.profit ?? 0) >= 0 ? "success" : "warning",
      });
    }

    // Trigger AI Analysis di background jika ada trade yang baru closed
    if (closedTrades.length > 0) {
      generateAIAnalysis(account.id).catch(console.error);
    }

    console.log(`TradeAI Webhook [${data.trigger}]: inserted=${inserted}, updated=${updated}, account=${account.id}`);

    return NextResponse.json({
      success:  true,
      trigger:  data.trigger,
      inserted,
      updated,
      total:    data.trades.length,
    });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}