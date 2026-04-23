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
export async function analyzeTradingPerformance(trades: any[], currency: string = "USD") {
  if (!trades || trades.length === 0) {
    return "Belum ada data trading untuk dianalisis. Mulai trading agar saya bisa memberikan insight! 🚀";
  }

  // Aggregate data for better AI context
  const totalProfit = trades.reduce((acc, t) => acc + (t.profit || 0), 0);
  const winRate = (trades.filter(t => (t.profit || 0) > 0).length / trades.length) * 100;
  
  const symbolStats = trades.reduce((acc, t) => {
    if (!acc[t.symbol]) acc[t.symbol] = { count: 0, profit: 0 };
    acc[t.symbol].count++;
    acc[t.symbol].profit += (t.profit || 0);
    return acc;
  }, {} as any);

  const statsString = Object.entries(symbolStats)
    .map(([sym, data]: any) => `${sym}: ${data.count} trades (Net Profit: ${data.profit.toFixed(2)} ${currency})`)
    .join(", ");

  const prompt = `Halo! Saya adalah TradeAI Analyst. Berikut data performa Anda dalam mata uang ${currency}:
  - Statistik: ${trades.length} trades, Win Rate ${winRate.toFixed(1)}%, Total Profit/Loss ${totalProfit.toFixed(2)} ${currency}
  - Aset: ${statsString}

  Berikan satu paragraf rangkuman singkat (maksimal 3 kalimat) mengenai pola trading saya dan satu tips utama untuk kedepannya.
  PENTING: Jangan gunakan format markdown seperti BOLD (**), ITALIC (*), atau simbol lainnya. Kirimkan dalam bentuk teks polos (plain text) saja agar mudah dibaca.
  Gunakan nada bicara TradeAI Analyst yang profesional dan memberikan semangat.`;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    // Strip any residual markdown just in case
    return response.text().replace(/[*_#`~]/g, "");
  } catch (error: any) {
    console.error("Gemini AI Analysis Error:", error);
    if (error.message?.includes("not found")) {
      return "AI Model Error: Layanan sedang sibuk. Hubungi support.";
    }
    return "Gagal sinkronisasi AI. Coba lagi nanti ya! 🙏";
  }
}
