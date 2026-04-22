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
  const cleaned = String(val).replace(/[^0-9.-]/g, "").trim();
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
    const isHeader = (h: string[]) => 
      (h.includes("symbol") || h.includes("item")) && 
      (h.includes("type") || h.includes("direction")) &&
      (h.includes("price") || h.includes("open price"));

    if (isHeader(rowHeaders)) {
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
  const profitCol = colIndex(["profit"]);
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
    if (!typeRaw.includes("buy") && !typeRaw.includes("sell")) continue;

    const symbol = String(row[symbolCol] || "");
    if (!symbol) continue;

    const openTime = parseDate(row[openTimeCol]);
    if (!openTime) continue;

    const ticket = ticketCol !== -1 ? String(row[ticketCol]) : `f_${i}_${openTime.getTime()}`;

    parsedTrades.push({
      externalTradeId: `file_${ticket}`,
      symbol,
      type: typeRaw.includes("buy") ? "buy" : "sell",
      volume: parseNumber(row[volumeCol]),
      openPrice: parseNumber(row[openPriceCol]),
      closePrice: closePriceCol !== -1 ? parseNumber(row[closePriceCol]) : null,
      profit: parseNumber(row[profitCol]),
      commission: parseNumber(row[colIndex(["commission"])]),
      swap: parseNumber(row[colIndex(["swap"])]),
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
