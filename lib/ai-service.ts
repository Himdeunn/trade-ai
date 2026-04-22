import { GoogleGenerativeAI } from "@google/generative-ai";

// Use a function to get the model to ensure env vars are loaded
function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  // Try using v1 instead of v1beta if possible, or just the model name
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function analyzeTradingPerformance(trades: any[]) {
  const prompt = `
    You are an expert trading psychologist and performance analyst. 
    Analyze the following trading history and provide:
    1. A summary of the trading style.
    2. Psychological patterns detected (e.g., revenge trading, over-leveraging).
    3. Three actionable tips for improvement.

    Trading Data:
    ${JSON.stringify(trades, null, 2)}
    
    Return the response in a structured format with headings.
  `;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini AI Analysis Error:", error);
    if (error.message?.includes("not found")) {
      return "AI Model Error: The selected model is not available. Please contact support.";
    }
    return "Failed to generate AI analysis. Please try again later.";
  }
}
