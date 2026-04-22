"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { trades, tradingAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface ParsedTrade {
  externalTradeId: string;
  symbol: string;
  type: string;
  volume: number;
  openPrice: number;
  closePrice: number | null;
  profit: number | null;
  commission: number | null;
  swap: number | null;
  openTime: Date;
  closeTime: Date | null;
}

// Parse a date string from MT4/MT5 format: "2024.01.15 12:30:00" or "2024-01-15 12:30:00"
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === "") return null;
  const cleaned = dateStr.trim().replace(/\./g, "-");
  const d = new Date(cleaned.replace(" ", "T"));
  return isNaN(d.getTime()) ? null : d;
}

function parseNumber(val: string): number {
  if (!val || val.trim() === "") return 0;
  return parseFloat(val.replace(/,/g, "").trim()) || 0;
}

// Detect and parse MT5 HTML Report format (tab-separated from the table)
// or MT4/MT5 CSV export format
export async function importTradesFromCSV(
  accountId: string,
  csvContent: string
): Promise<{ success: boolean; imported: number; skipped: number; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, imported: 0, skipped: 0, error: "Unauthorized" };

  // Verify this account belongs to the user
  const account = await db.query.tradingAccounts.findFirst({
    where: and(
      eq(tradingAccounts.id, accountId),
      eq(tradingAccounts.userId, session.user.id as string)
    ),
  });

  if (!account) return { success: false, imported: 0, skipped: 0, error: "Account not found" };

  const lines = csvContent
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { success: false, imported: 0, skipped: 0, error: "File is empty or has no data rows." };
  }

  // Detect delimiter and header index
  let delimiter = ",";
  let headerIndex = -1;
  let headers: string[] = [];

  // Try to find the header row by looking for keywords in the first 20 lines
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const line = lines[i];
    // Check both common delimiters
    const commaHeaders = line.split(",").map((h) => h.replace(/"/g, "").trim().toLowerCase());
    const tabHeaders = line.split("\t").map((h) => h.replace(/"/g, "").trim().toLowerCase());

    const isHeader = (h: string[]) => 
      (h.includes("symbol") || h.includes("item")) && 
      (h.includes("type") || h.includes("direction")) &&
      (h.includes("time") || h.includes("open") || h.includes("date"));

    if (isHeader(commaHeaders)) {
      delimiter = ",";
      headers = commaHeaders;
      headerIndex = i;
      break;
    } else if (isHeader(tabHeaders)) {
      delimiter = "\t";
      headers = tabHeaders;
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    // Fallback to first line if no header found, but usually this means it's not a valid MT4/MT5 report
    const firstLineHeaders = lines[0].split(",").map((h) => h.replace(/"/g, "").trim().toLowerCase());
    return {
      success: false,
      imported: 0,
      skipped: 0,
      error: `Could not detect required columns (Symbol, Type, Time). Found first line: ${firstLineHeaders.join(", ")}`,
    };
  }

  const colIndex = (names: string[]): number => {
    for (const name of names) {
      const idx = headers.findIndex((h) => h.includes(name));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const ticketCol    = colIndex(["ticket", "deal", "order", "#"]);
  const symbolCol    = colIndex(["symbol", "item", "pair"]);
  const typeCol      = colIndex(["type", "direction"]);
  const volumeCol    = colIndex(["volume", "size", "lots"]);
  const openPriceCol = colIndex(["open price", "price (open)", "open"]);
  const closePriceCol= colIndex(["close price", "price (close)", "close"]);
  const profitCol    = colIndex(["profit"]);
  const commissionCol= colIndex(["commission"]);
  const swapCol      = colIndex(["swap"]);
  const openTimeCol  = colIndex(["open time", "time (open)", "open", "time"]);
  const closeTimeCol = colIndex(["close time", "time (close)", "close"]);

  const parsedTrades: ParsedTrade[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map((c) => c.replace(/"/g, "").trim());
    if (cols.length < 3) continue;

    const typeRaw = cols[typeCol]?.toLowerCase() || "";
    // Skip non-trade rows (balance, credit, etc.)
    if (!typeRaw.includes("buy") && !typeRaw.includes("sell")) continue;

    const type = typeRaw.includes("buy") ? "buy" : "sell";
    const symbol = cols[symbolCol] || "";
    if (!symbol) continue;

    const ticket = ticketCol !== -1 ? cols[ticketCol] : `csv_${i}_${Date.now()}`;
    const openTime = openTimeCol !== -1 ? parseDate(cols[openTimeCol]) : null;
    if (!openTime) continue;

    parsedTrades.push({
      externalTradeId: `csv_${ticket}`,
      symbol,
      type,
      volume: volumeCol !== -1 ? parseNumber(cols[volumeCol]) : 0,
      openPrice: parseNumber(cols[openPriceCol]),
      closePrice: closePriceCol !== -1 ? parseNumber(cols[closePriceCol]) : null,
      profit: profitCol !== -1 ? parseNumber(cols[profitCol]) : null,
      commission: commissionCol !== -1 ? parseNumber(cols[commissionCol]) : null,
      swap: swapCol !== -1 ? parseNumber(cols[swapCol]) : null,
      openTime,
      closeTime: closeTimeCol !== -1 ? parseDate(cols[closeTimeCol]) : null,
    });
  }

  if (parsedTrades.length === 0) {
    return { success: false, imported: 0, skipped: 0, error: "No valid buy/sell trades found in the file." };
  }

  // Insert trades, skip duplicates
  let imported = 0;
  let skipped = 0;

  for (const trade of parsedTrades) {
    const existing = await db.query.trades.findFirst({
      where: and(
        eq(trades.accountId, accountId),
        eq(trades.externalTradeId, trade.externalTradeId)
      ),
    });

    if (existing) {
      skipped++;
      continue;
    }

    await db.insert(trades).values({
      accountId,
      externalTradeId: trade.externalTradeId,
      symbol: trade.symbol,
      type: trade.type,
      volume: trade.volume,
      openPrice: trade.openPrice,
      closePrice: trade.closePrice,
      profit: trade.profit,
      commission: trade.commission,
      swap: trade.swap,
      openTime: trade.openTime,
      closeTime: trade.closeTime,
    });
    imported++;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/history");
  revalidatePath("/dashboard/performance");

  return { success: true, imported, skipped };
}
