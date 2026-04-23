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

// Parse a date string from MT4/MT5 format or Excel serial number
function parseDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  
  // Handle Excel serial numbers (numbers like 45000.5)
  if (typeof val === "number" || (!isNaN(Number(val)) && !String(val).includes("-") && !String(val).includes("."))) {
    const serial = Number(val);
    if (serial > 0 && serial < 100000) { // Reasonable Excel date range
      return new Date(Math.round((serial - 25569) * 86400 * 1000));
    }
  }

  const str = String(val).trim();
  // Try MetaTrader format: "2024.01.15 12:30:00"
  const mtFormat = str.replace(/\./g, "-").replace(" ", "T");
  let d = new Date(mtFormat);
  
  // Fallback for other formats
  if (isNaN(d.getTime())) {
    d = new Date(str);
  }

  // Final check for displacement error (PostgreSQL limit is usually 4713 BC to 294276 AD)
  if (isNaN(d.getTime()) || d.getFullYear() > 10000 || d.getFullYear() < 1900) {
    return null;
  }
  
  return d;
}

function parseNumber(val: any): number {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return val;
  
  let str = String(val).trim();
  
  // Handle formats like "1.267.122,45" (IDR/European)
  // If there are dots and a comma at the end, it's IDR style
  if (str.includes(".") && str.includes(",")) {
    str = str.replace(/\./g, "").replace(",", ".");
  } 
  // Handle formats like "1,267,122.45" (US style)
  else if (str.includes(",") && str.includes(".")) {
    str = str.replace(/,/g, "");
  }
  // Handle formats like "1267122,45" (No thousands sep, comma decimal)
  else if (str.includes(",") && !str.includes(".")) {
    str = str.replace(",", ".");
  }

  const cleaned = str.replace(/[^0-9.-]/g, "");
  return parseFloat(cleaned) || 0;
}

export async function importTradesFromFile(
  accountId: string,
  base64Content: string,
  fileName: string
): Promise<{ success: boolean; imported: number; skipped: number; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, imported: 0, skipped: 0, error: "Unauthorized" };

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
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  } catch (err) {
    console.error("Error parsing file:", err);
    return { success: false, imported: 0, skipped: 0, error: "Could not read the file." };
  }

  if (data.length < 2) {
    return { success: false, imported: 0, skipped: 0, error: "File is empty or has no data rows." };
  }

  let headerIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(data.length, 50); i++) {
    const row = data[i];
    if (!Array.isArray(row)) continue;
    
    const rowHeaders = row.map((h) => String(h || "").trim().toLowerCase());
    const hasSymbol = rowHeaders.some(h => h.includes("symbol") || h.includes("item"));
    const hasProfit = rowHeaders.some(h => h === "profit" || h === "profit/loss");
    const hasType = rowHeaders.some(h => h.includes("type") || h.includes("direction"));

    if (hasSymbol && hasType && hasProfit) {
      headers = rowHeaders;
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    return {
      success: false, imported: 0, skipped: 0,
      error: "Could not detect required columns. Please use a standard MetaTrader report.",
    };
  }

  // Robust column detection for duplicates (MT5 uses Time/Price twice)
  const timeIndices = headers.map((h, idx) => (h.includes("time") || h === "open" ? idx : -1)).filter(i => i !== -1);
  const priceIndices = headers.map((h, idx) => (h.includes("price") || h === "open" || h === "close" ? idx : -1)).filter(i => i !== -1);
  
  const colIndex = (names: string[], skipIdx: number = -1): number => {
    for (const name of names) {
      const idx = headers.findIndex((h, i) => h.includes(name) && i !== skipIdx);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const symbolCol = colIndex(["symbol", "item", "pair"]);
  const typeCol = colIndex(["type", "direction"]);
  const volumeCol = colIndex(["volume", "size", "lots"]);
  
  // Stricter profit detection to avoid "Balance", "Profit Factor", or "Total Profit"
  const profitCol = headers.findIndex(h => h === "profit" || h === "profit/loss");
  
  const ticketCol = colIndex(["ticket", "deal", "order", "#"]);

  // Open/Close specific detection
  let openTimeCol = timeIndices[0];
  let closeTimeCol = timeIndices.length > 1 ? timeIndices[1] : -1;
  
  let openPriceCol = priceIndices[0];
  let closePriceCol = priceIndices.length > 1 ? priceIndices[1] : -1;

  // Refine if specific headers exist
  const specificOpenTime = colIndex(["open time", "time (open)"]);
  if (specificOpenTime !== -1) openTimeCol = specificOpenTime;
  
  const specificCloseTime = colIndex(["close time", "time (close)"]);
  if (specificCloseTime !== -1) closeTimeCol = specificCloseTime;

  const specificOpenPrice = colIndex(["open price", "price (open)"]);
  if (specificOpenPrice !== -1) openPriceCol = specificOpenPrice;

  const specificClosePrice = colIndex(["close price", "price (close)"]);
  if (specificClosePrice !== -1) closePriceCol = specificClosePrice;

  const parsedTrades: ParsedTrade[] = [];

  for (let i = headerIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!Array.isArray(row) || row.length < 3) continue;

    const typeRaw = String(row[typeCol] || "").toLowerCase();
    const isTrade = typeRaw.includes("buy") || typeRaw.includes("sell");
    const isBalanceOp = typeRaw.includes("balance") || typeRaw.includes("deposit") || typeRaw.includes("withdrawal");
    
    if (!isTrade && !isBalanceOp) continue;

    const symbol = isTrade ? String(row[symbolCol] || "") : "BALANCE";
    const openTime = parseDate(row[openTimeCol]);
    if (!openTime) continue;

    const ticket = ticketCol !== -1 ? String(row[ticketCol]) : `f_${i}_${openTime.getTime()}`;
    const profit = parseNumber(row[profitCol]);

    parsedTrades.push({
      externalTradeId: `file_${ticket}`,
      symbol,
      type: isTrade ? (typeRaw.includes("buy") ? "buy" : "sell") : (profit >= 0 ? "deposit" : "withdrawal"),
      volume: isTrade ? parseNumber(row[volumeCol]) : 0,
      openPrice: isTrade ? parseNumber(row[openPriceCol]) : 0,
      closePrice: isTrade && closePriceCol !== -1 ? parseNumber(row[closePriceCol]) : null,
      profit: profit,
      commission: parseNumber(row[colIndex(["commission"])]),
      swap: parseNumber(row[colIndex(["swap"])]),
      openTime,
      closeTime: isTrade && closeTimeCol !== -1 ? parseDate(row[closeTimeCol]) : null,
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

  // Update account balance after import
  const allTrades = await db.query.trades.findMany({
    where: eq(trades.accountId, accountId),
  });
  
  const totalHistoricalProfit = allTrades.reduce((acc, t) => acc + (t.profit || 0), 0);
  const balance = totalHistoricalProfit;
  const equity = totalHistoricalProfit;

  await db.update(tradingAccounts)
    .set({ balance, equity })
    .where(eq(tradingAccounts.id, accountId));

  // Create notification
  const { createNotification } = await import("@/lib/notifications");
  await createNotification({
    userId: account.userId,
    title: "Sync Successful",
    message: `Successfully imported ${imported} transactions and updated your balance.`,
    type: "success",
  });

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
