"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { trades, tradingAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";

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
function parseDate(dateStr: any): Date | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  const str = String(dateStr).trim().replace(/\./g, "-");
  const d = new Date(str.replace(" ", "T"));
  return isNaN(d.getTime()) ? null : d;
}

function parseNumber(val: any): number {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return val;
  return parseFloat(String(val).replace(/,/g, "").trim()) || 0;
}

export async function importTradesFromFile(
  accountId: string,
  base64Content: string,
  fileName: string
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

  let data: any[][] = [];

  try {
    const buffer = Buffer.from(base64Content, "base64");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  } catch (err) {
    console.error("Error parsing file:", err);
    return { success: false, imported: 0, skipped: 0, error: "Could not read the file. Please ensure it is a valid CSV or XLSX file." };
  }

  if (data.length < 2) {
    return { success: false, imported: 0, skipped: 0, error: "File is empty or has no data rows." };
  }

  // Detect header index
  let headerIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(data.length, 30); i++) {
    const row = data[i];
    if (!Array.isArray(row)) continue;
    
    const rowHeaders = row.map((h) => String(h || "").trim().toLowerCase());

    const isHeader = (h: string[]) => 
      (h.includes("symbol") || h.includes("item")) && 
      (h.includes("type") || h.includes("direction")) &&
      (h.includes("time") || h.includes("open") || h.includes("date"));

    if (isHeader(rowHeaders)) {
      headers = rowHeaders;
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      error: "Could not detect required columns (Symbol, Type, Time). Please ensure you are using a standard MetaTrader report.",
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

  for (let i = headerIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!Array.isArray(row) || row.length < 3) continue;

    const typeRaw = String(row[typeCol] || "").toLowerCase();
    if (!typeRaw.includes("buy") && !typeRaw.includes("sell")) continue;

    const type = typeRaw.includes("buy") ? "buy" : "sell";
    const symbol = String(row[symbolCol] || "");
    if (!symbol) continue;

    const ticket = ticketCol !== -1 ? String(row[ticketCol]) : `file_${i}_${Date.now()}`;
    const openTime = openTimeCol !== -1 ? parseDate(row[openTimeCol]) : null;
    if (!openTime) continue;

    parsedTrades.push({
      externalTradeId: `file_${ticket}`,
      symbol,
      type,
      volume: volumeCol !== -1 ? parseNumber(row[volumeCol]) : 0,
      openPrice: parseNumber(row[openPriceCol]),
      closePrice: closePriceCol !== -1 ? parseNumber(row[closePriceCol]) : null,
      profit: profitCol !== -1 ? parseNumber(row[profitCol]) : null,
      commission: commissionCol !== -1 ? parseNumber(row[commissionCol]) : null,
      swap: swapCol !== -1 ? parseNumber(row[swapCol]) : null,
      openTime,
      closeTime: closeTimeCol !== -1 ? parseDate(row[closeTimeCol]) : null,
    });
  }

  if (parsedTrades.length === 0) {
    return { success: false, imported: 0, skipped: 0, error: "No valid buy/sell trades found in the file." };
  }

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

/**
 * @deprecated Use importTradesFromFile instead for better binary support
 */
export async function importTradesFromCSV(accountId: string, csvContent: string) {
  return importTradesFromFile(accountId, Buffer.from(csvContent).toString("base64"), "import.csv");
}
