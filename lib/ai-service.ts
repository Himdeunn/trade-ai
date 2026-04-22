import { GoogleGenerativeAI } from "@google/generative-ai";

// Use a function to get the model to ensure env vars are loaded
function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  // Menggunakan Gemini 2.5 Flash sesuai permintaan (General Availability).
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
    .map(([sym, data]: any) => `${sym}: ${data.count} trades (Net Profit: ${data.profit.toFixed(2)})`)
    .join(" | ");

  const prompt = `Halo! Saya adalah TradeAI Analyst. Berikut adalah data performa trading Anda:
  - Ringkasan Statistik: ${trades.length} trades, Win Rate ${winRate.toFixed(1)}%, Profit/Loss ${totalProfit.toFixed(2)}
  - Performa per Asset: [ ${statsString} ]

  Sebagai pakar psikologi trading dari TradeAI, berikan analisis tajam mengenai pola trading saya dalam 2-3 kalimat yang sangat informatif. 
  Setelah itu, berikan 2 tips 'God Tier' untuk meningkatkan profitabilitas di sesi berikutnya.
  
  Gunakan nada bicara yang antusias, profesional, dan memberikan semangat (seperti coach trading pribadi).
  Format output wajib menggunakan **markdown tebal** pada istilah teknis dan angka penting.`;

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
