import { GoogleGenerativeAI } from "@google/generative-ai";

// Use a function to get the model to ensure env vars are loaded
function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  // Try using v1 instead of v1beta if possible, or just the model name
  // Using gemini-1.5-flash as the stable version (2.5 is not yet available)
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function analyzeTradingPerformance(trades: any[]) {
  if (!trades || trades.length === 0) {
    return "Belum ada data trading untuk dianalisis. Mulai trading atau import history agar saya bisa memberikan insight! 🚀";
  }

  // Aggregate data for better AI context (similar to reference code style)
  const totalProfit = trades.reduce((acc, t) => acc + (t.profit || 0), 0);
  const winRate = (trades.filter(t => (t.profit || 0) > 0).length / trades.length) * 100;
  
  const symbolStats = trades.reduce((acc, t) => {
    if (!acc[t.symbol]) acc[t.symbol] = { count: 0, profit: 0 };
    acc[t.symbol].count++;
    acc[t.symbol].profit += (t.profit || 0);
    return acc;
  }, {} as any);

  const statsString = Object.entries(symbolStats)
    .map(([sym, data]: any) => `${sym}: ${data.count} trades (Profit: ${data.profit.toFixed(2)})`)
    .join(" | ");

  const prompt = `Saya memiliki data performa trading berikut:
  - Total Trades: ${trades.length}
  - Win Rate: ${winRate.toFixed(1)}%
  - Total Profit/Loss: ${totalProfit.toFixed(2)}
  - Detail Per Symbol: [ ${statsString} ]

  Berikan analisis psikologi trading saya dalam 2-3 kalimat yang sangat padat dan 2 tips peningkatan performa yang spesifik. 
  Gunakan nada bicara santai seperti teman (bro/sis) tapi tetap profesional sebagai expert analyst. 
  Format output harus menggunakan **markdown tebal** pada poin-poin penting.`;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini AI Analysis Error:", error);
    if (error.message?.includes("not found")) {
      return "AI Model Error: Model 'gemini-1.5-flash' tidak ditemukan atau limit API tercapai. Hubungi support.";
    }
    return "Gagal sinkronisasi AI. Coba lagi nanti ya! 🙏";
  }
}
